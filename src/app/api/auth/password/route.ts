import { db } from '@/lib/db'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { audit, hashPassword, requireStaff, verifyPassword } from '@/lib/auth'
import { MIN_STAFF_PASSWORD } from '@/lib/permissions'
import { clientIp, rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/password — { current, next }
 *
 * Deliberately NOT behind requirePermission: an account on a temporary
 * password can do nothing else, and this is the one thing it must be able to
 * do. The current password is still required, so a borrowed session cannot
 * take the account over.
 */
export async function POST(req: Request) {
  try {
    const user = await requireStaff()
    const limit = await rateLimit('password-change', clientIp(req), 10, 15 * 60)
    if (!limit.allowed) return fail('Too many attempts. Try again later.', 429)

    const b = await readJson<{ current?: string; next?: string }>(req)
    if (!b?.current || !b?.next) return fail('Enter your current and new password.')
    if (b.next.length < MIN_STAFF_PASSWORD) {
      return fail(`The new password must be at least ${MIN_STAFF_PASSWORD} characters.`)
    }
    if (b.next === b.current) return fail('The new password must be different.')

    const staff = await db.staff.findUnique({ where: { id: user.id } })
    if (!staff) return fail('Not signed in.', 401)
    if (!(await verifyPassword(b.current, staff.passwordHash))) {
      return fail('Your current password is not correct.', 401)
    }

    await db.staff.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(b.next), mustChangePassword: false },
    })
    await audit(user, 'auth.password-change', user.email)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
