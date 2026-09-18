import { ok, handleError } from '@/lib/api'
import { destroyStudentSession } from '@/lib/student-auth'

export const dynamic = 'force-dynamic'

/** POST /api/student/logout — clears the student session cookie. */
export async function POST() {
  try {
    await destroyStudentSession()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
