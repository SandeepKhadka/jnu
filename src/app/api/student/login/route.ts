import { ok, fail, handleError, readJson } from '@/lib/api'
import { clientIp, rateLimit, clearRateLimit } from '@/lib/ratelimit'
import { createStudentSession, verifyStudent } from '@/lib/student-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/student/login — { rollNo, dob } → session cookie.
 *
 * Rate limited per IP before the database is touched at all. Roll numbers are
 * sequential and dates of birth are guessable, so an unthrottled endpoint here
 * would let anyone walk the register and collect names, parents' names and
 * photographs. Ten attempts in fifteen minutes is generous for a student
 * mistyping their own date of birth and useless for enumeration.
 */
export async function POST(req: Request) {
  try {
    const limit = await rateLimit('student-login', clientIp(req), 10, 15 * 60)
    if (!limit.allowed) {
      return fail(
        `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429
      )
    }

    const body = await readJson<{ rollNo?: string; dob?: string }>(req)
    if (!body?.rollNo || !body?.dob) {
      return fail('Roll number and date of birth are required.')
    }
    if (body.rollNo.length > 24) return fail('That roll number is too long.')

    const result = await verifyStudent(body.rollNo, body.dob)
    if (!result.ok) return fail(result.error, 401)

    await createStudentSession(result.student)
    await clearRateLimit('student-login', clientIp(req))

    return ok({ student: result.student })
  } catch (e) {
    return handleError(e)
  }
}
