import { db } from '@/lib/db'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { clientIp, rateLimit } from '@/lib/ratelimit'
import { normaliseDob } from '@/lib/student-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/certificates/verify — { rollNo, dob } → certificate status.
 *
 * Verification is now keyed on roll number + date of birth rather than the
 * certificate number, at the university's request.
 *
 * WHY THIS IS A POST, AND THROTTLED
 * ---------------------------------
 * The previous version took a certificate number in the query string, which
 * was fine: a certificate number is a high-entropy value that only someone
 * holding the document has. Roll number + date of birth is neither — roll
 * numbers are sequential and a cohort's dates of birth span a few years — so
 * the same endpoint shape would let anyone walk the register and harvest
 * names and programmes.
 *
 * Hence: POST rather than GET, so the pair never lands in a URL, a server log,
 * a browser history entry or a Referer header; and a per-IP limit, so the
 * space cannot be walked. A failed match returns one generic message that does
 * not say which half was wrong.
 */
export async function POST(req: Request) {
  try {
    const limit = await rateLimit('verify', clientIp(req), 15, 15 * 60)
    if (!limit.allowed) {
      return fail(
        `Too many verification attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429
      )
    }

    const body = await readJson<{ rollNo?: string; dob?: string }>(req)
    if (!body?.rollNo?.trim() || !body?.dob?.trim()) {
      return fail('A roll number and date of birth are both required.')
    }

    const roll = body.rollNo.trim().toUpperCase()
    const dob = normaliseDob(body.dob)

    if (roll.length > 24) return fail('That roll number is too long.')
    if (!dob) return fail('Enter the date of birth as it appears on the certificate.')

    const student = await db.student.findUnique({
      where: { rollNo: roll },
      select: { id: true, dob: true, fullName: true },
    })

    // One response for "no such roll number" and for "wrong date of birth".
    // Distinguishing them would turn this into a roll-number oracle.
    if (!student || student.dob !== dob) {
      return ok({ certificate: null })
    }

    const row = await db.certificate.findFirst({
      where: { OR: [{ studentId: student.id }, { studentId: null, rollNo: roll }] },
      orderBy: { awardYear: 'desc' },
      select: {
        certificateNo: true,
        studentName: true,
        programme: true,
        awardYear: true,
        enrollmentNo: true,
        division: true,
        status: true,
        registrarRemarks: true,
      },
    })

    // A student on record with no certificate issued is reported distinctly:
    // "we know this person, nothing has been awarded" is a different and more
    // useful answer to an employer than "not found".
    if (!row) return ok({ certificate: null, studentOnRecord: true })

    return ok({ certificate: row })
  } catch (e) {
    return handleError(e)
  }
}
