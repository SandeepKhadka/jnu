import { db } from '@/lib/db'
import { verifyPassword, createSession, audit, type Role } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 *
 * The password is compared against a bcrypt hash on the server; neither the
 * hash nor the password is ever sent to the browser. On success the client
 * receives only an httpOnly session cookie.
 */
export async function POST(req: Request) {
  try {
    const body = await readJson<{ email?: string; password?: string }>(req)
    if (!body?.email || !body?.password) return fail('Email and password are required.')

    const staff = await db.staff.findUnique({
      where: { email: body.email.trim().toLowerCase() },
    })

    // Generic message either way: never reveal whether the account exists.
    const INVALID = 'Incorrect email or password.'
    if (!staff) return fail(INVALID, 401)

    const okPassword = await verifyPassword(body.password, staff.passwordHash)
    if (!okPassword) return fail(INVALID, 401)

    const user = {
      id: staff.id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role as Role,
    }
    await createSession(user)
    await audit(user, 'auth.signin', staff.email)

    return ok({ user })
  } catch (e) {
    return handleError(e)
  }
}
