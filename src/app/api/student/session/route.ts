import { ok, handleError } from '@/lib/api'
import { getStudentSession } from '@/lib/student-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/student/session — who, if anyone, is signed in.
 *
 * Separate from /api/student/me because the header calls this on EVERY page
 * load, for every visitor, signed in or not. /me also loads the full profile
 * and runs the results query; paying for that on every page view to render a
 * name in a button would be waste. This reads the cookie and does one lookup.
 */
export async function GET() {
  try {
    const session = await getStudentSession()
    return ok({
      student: session ? { rollNo: session.rollNo, fullName: session.fullName } : null,
    })
  } catch (e) {
    return handleError(e)
  }
}
