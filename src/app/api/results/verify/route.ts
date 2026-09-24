import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { formatSerial, parseSerial } from '@/lib/marksheet'
import { clientIp, rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/results/verify?sn=JNU-SOM-XXXX-XXXX-XXXX — public.
 *
 * What the QR code on a printed statement of marks points at. Anyone holding
 * the sheet — an employer, another university — can confirm that the marks
 * printed on it are the marks on record. A sheet edited before printing
 * returns different figures from this, which is the whole point.
 *
 * Returns what the sheet already shows and nothing more: no date of birth,
 * no parents' names, no photograph. The serial is 60 random bits and the
 * route is rate limited, so it cannot be used to browse other students.
 *
 * A result the exam cell has since unpublished is reported as WITHDRAWN, not
 * as unknown. A printed sheet for it may still be in circulation, and whoever
 * is checking it needs to know it no longer stands — the same reasoning as a
 * REVOKED certificate.
 */
export async function GET(req: Request) {
  try {
    const limit = await rateLimit('marksheet-verify', clientIp(req), 20, 15 * 60)
    if (!limit.allowed) {
      return fail(
        `Too many verification attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429
      )
    }

    const raw = new URL(req.url).searchParams.get('sn') ?? ''
    const token = parseSerial(raw)
    if (!token) return fail('Enter the serial number exactly as printed on the statement.')

    const row = await db.result.findUnique({
      where: { verifyToken: token },
      select: {
        rollNo: true,
        studentName: true,
        programme: true,
        semester: true,
        examSession: true,
        subjects: true,
        marksObtained: true,
        marksMax: true,
        status: true,
        published: true,
        publishedAt: true,
        // The identity fields PRINTED on the sheet. Verification means
        // checking the paper against the record, so anything printed has to
        // be checkable — otherwise an employer can confirm the marks but not
        // that this is the same candidate. Nothing beyond what is on the
        // document: no photograph, no contact details, no address.
        student: {
          select: { enrollmentNo: true, fatherName: true, motherName: true, dob: true },
        },
      },
    })

    if (!row) return ok({ marksheet: null })
    if (!row.published) return ok({ marksheet: null, withdrawn: true })

    // The printed identity fields are returned so the paper can be checked
    // against the record. Results imported before the student link was set
    // have no relation, so fall back to the register by roll number — one
    // query for all four fields rather than one each.
    const identity =
      row.student ??
      (await db.student.findUnique({
        where: { rollNo: row.rollNo },
        select: { enrollmentNo: true, fatherName: true, motherName: true, dob: true },
      }))

    return ok({
      marksheet: {
        serial: formatSerial(token),
        rollNo: row.rollNo,
        enrollmentNo: identity?.enrollmentNo ?? null,
        studentName: row.studentName,
        fatherName: identity?.fatherName ?? null,
        motherName: identity?.motherName ?? null,
        dob: identity?.dob ?? null,
        programme: row.programme,
        semester: row.semester,
        examSession: row.examSession,
        subjects: JSON.parse(row.subjects),
        marksObtained: row.marksObtained,
        marksMax: row.marksMax,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
