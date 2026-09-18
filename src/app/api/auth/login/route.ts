import { db } from '@/lib/db'
import { verifyPassword, createSession, audit, type Role } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { clearRateLimit, clientIp, rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 *
 * The password is compared against a bcrypt hash on the server; neither the
 * hash nor the password is ever sent to the browser. On success the client
 * receives only an httpOnly session cookie.
 *
 * Throttled twice: per IP (someone spraying many accounts) and per email
 * (someone guessing one account from many IPs). This login now controls the
 * whole site — results, degrees, content — so an unthrottled endpoint would
 * be the weakest point of it.
 */
export async function POST(req: Request) {
  try {
    const body = await readJson<{ email?: string; password?: string }>(req)
    if (!body?.email || !body?.password) return fail('Email and password are required.')

    const email = body.email.trim().toLowerCase()
    const ip = clientIp(req)
    const [byIp, byAccount] = await Promise.all([
      rateLimit('staff-login-ip', ip, 20, 15 * 60),
      rateLimit('staff-login-account', email, 8, 15 * 60),
    ])
    if (!byIp.allowed || !byAccount.allowed) {
      return fail('Too many sign-in attempts. Wait 15 minutes and try again.', 429)
    }

    const staff = await db.staff.findUnique({ where: { email } })

    // Generic message either way: never reveal whether the account exists.
    const INVALID = 'Incorrect email or password.'
    if (!staff || staff.disabled) return fail(INVALID, 401)

    const okPassword = await verifyPassword(body.password, staff.passwordHash)
    if (!okPassword) return fail(INVALID, 401)

    const user = {
      id: staff.id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role as Role,
      mustChangePassword: staff.mustChangePassword,
    }
    await createSession(user)
    await clearRateLimit('staff-login-account', email)
    await db.staff.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } })
    await audit(user, 'auth.signin', staff.email)

    return ok({ user })
  } catch (e) {
    return handleError(e)
  }
}
