import { getSessionUser } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/auth/me — who is signed in, from the httpOnly cookie. */
export async function GET() {
  try {
    return ok({ user: await getSessionUser() })
  } catch (e) {
    return handleError(e)
  }
}
