import { db } from '@/lib/db'
import { requireStaff, audit } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/certificates — staff only. The full register. */
export async function GET() {
  try {
    await requireStaff()
    const rows = await db.certificate.findMany({ orderBy: { issuedOn: 'desc' }, take: 500 })
    return ok({ certificates: rows })
  } catch (e) {
    return handleError(e)
  }
}

const STATUSES = ['VERIFIED', 'REVOKED', 'WITHHELD']

/**
 * POST /api/certificates — staff only.
 *
 * The record is written here, before the client renders anything printable.
 * A certificate that cannot be checked against the register is precisely the
 * problem this feature exists to prevent, so issuing and recording are one
 * operation rather than two.
 */
export async function POST(req: Request) {
  try {
    const user = await requireStaff()
    const body = await readJson<{
      certificateNo?: string
      studentName?: string
      programme?: string
      awardYear?: number
      enrollmentNo?: string
      division?: string
      status?: string
      registrarRemarks?: string
    }>(req)
    if (!body) return fail('Invalid request body.')

    const certificateNo = body.certificateNo?.trim().toUpperCase()
    const studentName = body.studentName?.trim()
    const year = Number(body.awardYear)
    const thisYear = new Date().getFullYear()

    if (!certificateNo) return fail('A certificate number is required.')
    if (!studentName) return fail('The student name is required.')
    if (!body.programme?.trim()) return fail('The programme is required.')
    if (!Number.isInteger(year) || year < 1950 || year > thisYear) {
      return fail(`Year of award must be between 1950 and ${thisYear}.`)
    }

    const status = (body.status ?? 'VERIFIED').toUpperCase()
    if (!STATUSES.includes(status)) return fail(`Status must be one of ${STATUSES.join(', ')}.`)

    const row = await db.certificate.create({
      data: {
        certificateNo,
        studentName,
        programme: body.programme.trim(),
        awardYear: year,
        enrollmentNo: body.enrollmentNo?.trim() || '—',
        division: body.division?.trim() || 'First Division',
        status,
        registrarRemarks: body.registrarRemarks?.trim() || null,
      },
    })

    await audit(user, 'certificate.create', `${certificateNo} — ${studentName}`)
    return ok({ certificate: row }, 201)
  } catch (e) {
    return handleError(e)
  }
}
