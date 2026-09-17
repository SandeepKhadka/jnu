import { destroySession, getSessionUser, audit } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  try {
    const user = await getSessionUser()
    if (user) await audit(user, 'auth.signout', user.email)
    await destroySession()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
