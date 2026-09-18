import { db } from '@/lib/db'
import { audit, requireRole } from '@/lib/auth'
import { requirePermission } from '@/lib/admin-route'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { formatSerial } from '@/lib/marksheet'
import { ensureCertificateTokens, newVerifyToken } from '@/lib/marksheet-token'

export const dynamic = 'force-dynamic'

/** GET /api/certificates — staff only. The full register, each with its serial. */
export async function GET() {
  try {
    await requirePermission('certificates.view')
    const rows = await db.certificate.findMany({ orderBy: { issuedOn: 'desc' }, take: 500 })
    const tokens = await ensureCertificateTokens(rows)
    return ok({
      certificates: rows.map(({ verifyToken: _t, ...r }) => {
        const t = tokens.get(r.id)
        return { ...r, serial: t ? formatSerial(t, 'DEG') : null }
      }),
    })
  } catch (e) {
    return handleError(e)
  }
}

const DIVISIONS = [
  'First Division with Distinction',
  'First Division',
  'Second Division',
  'Third Division',
]

/**
 * POST /api/certificates — REGISTRAR ONLY. Issues a degree.
 *
 * { rollNo, awardYear, division, certificateNo, registrarRemarks? }
 *
 * The degree is issued to a STUDENT ON THE REGISTER, identified by roll
 * number. Name, programme and enrollment number are taken from that record,
 * not typed in. Previously any member of staff could type any name against
 * any programme and receive a certificate that the public verification page
 * would then confirm — for an institution whose degrees were once sold, that
 * is the single capability this system must not have.
 *
 * Also refused: a second valid degree for the same student and programme, and
 * a degree for a withdrawn student. The record is written before anything
 * printable exists, so everything printed is in the register.
 */
export async function POST(req: Request) {
  try {
    const user = await requireRole('registrar')
    const body = await readJson<{
      rollNo?: string
      certificateNo?: string
      awardYear?: number | string
      division?: string
      registrarRemarks?: string
    }>(req)
    if (!body) return fail('Invalid request body.')

    const rollNo = body.rollNo?.trim().toUpperCase()
    const certificateNo = body.certificateNo?.trim().toUpperCase()
    const year = Number(body.awardYear)
    const thisYear = new Date().getFullYear()

    if (!rollNo) return fail('Enter the roll number of the student receiving the degree.')
    if (!certificateNo) return fail('A certificate number is required.')
    if (!Number.isInteger(year) || year < 1950 || year > thisYear) {
      return fail(`Year of award must be between 1950 and ${thisYear}.`)
    }
    const division = body.division?.trim() ?? ''
    if (!DIVISIONS.includes(division)) return fail('Select a division from the list.')

    const student = await db.student.findUnique({ where: { rollNo } })
    if (!student) return fail(`No student with roll number ${rollNo} is on the register.`, 404)
    if (student.status === 'WITHDRAWN') {
      return fail(`${rollNo} is recorded as withdrawn; a degree cannot be issued.`, 409)
    }

    const existing = await db.certificate.findFirst({
      where: {
        OR: [{ studentId: student.id }, { rollNo }],
        programme: student.programme,
        status: { in: ['VERIFIED', 'WITHHELD'] },
      },
      select: { certificateNo: true },
    })
    if (existing) {
      return fail(
        `${rollNo} already holds ${existing.certificateNo} for ${student.programme}. ` +
          'Revoke it first if a replacement is being issued.',
        409
      )
    }

    const row = await db.certificate.create({
      data: {
        certificateNo,
        studentName: student.fullName,
        programme: student.programme,
        awardYear: year,
        enrollmentNo: student.enrollmentNo,
        division,
        status: 'VERIFIED',
        registrarRemarks: body.registrarRemarks?.trim() || null,
        rollNo,
        studentId: student.id,
        verifyToken: newVerifyToken(),
      },
    })

    // A student holding a degree has graduated; keep the register consistent.
    if (student.status === 'ACTIVE') {
      await db.student.update({ where: { id: student.id }, data: { status: 'GRADUATED' } })
    }

    await audit(user, 'certificate.issue', `${certificateNo} — ${student.fullName} (${rollNo})`)

    const { verifyToken, ...rest } = row
    return ok(
      { certificate: { ...rest, serial: verifyToken ? formatSerial(verifyToken, 'DEG') : null } },
      201
    )
  } catch (e) {
    return handleError(e)
  }
}

