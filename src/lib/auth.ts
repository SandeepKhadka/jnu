import 'server-only'

import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { can, type Permission, type Role } from '@/lib/permissions'

/**
 * Server-side authentication.
 *
 * Passwords are bcrypt-hashed and never leave the server. The session is a
 * signed JWT in an httpOnly cookie, so client-side JavaScript cannot read it
 * and an XSS bug cannot steal it. This is the real boundary — unlike the
 * previous localStorage version, hiding the admin UI is no longer what keeps
 * anyone out: every protected API route verifies this cookie server-side.
 */

const COOKIE = 'jnu_session'
const MAX_AGE_SECONDS = 60 * 60 * 8 // one working day

export type { Role } from '@/lib/permissions'

export type SessionUser = {
  id: string
  email: string
  fullName: string
  role: Role
  /** True until the account's temporary password has been replaced. */
  mustChangePassword?: boolean
}

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) {
    throw new Error(
      'AUTH_SECRET must be set to a random string of at least 32 characters. See .env.local.example.'
    )
  }
  return new TextEncoder().encode(value)
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

/** Returns the signed-in staff member, or null. Never throws on a bad token. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub) return null

    // Confirm the account still exists and re-read the role from the database,
    // so revoking an account takes effect before the token expires.
    const staff = await db.staff.findUnique({ where: { id: payload.sub } })
    // A disabled account loses access immediately, not when its token expires.
    if (!staff || staff.disabled) return null

    return {
      id: staff.id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role as Role,
      mustChangePassword: staff.mustChangePassword,
    }
  } catch {
    // Expired, tampered with, or signed by a different secret.
    return null
  }
}

/** Guard for protected API routes. Throws `Unauthorized` when not signed in. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new UnauthorizedError()
  return user
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

/** Writes an audit entry. Every mutating route calls this. */
export async function audit(
  user: SessionUser,
  action: string,
  detail: string
): Promise<void> {
  await db.auditLog.create({
    data: { actorId: user.id, actorEmail: user.email, action, detail },
  })
}

/**
 * Guard for a permission from lib/permissions.ts — the normal way to protect
 * an admin route. The same table drives what the admin UI shows.
 *
 * An account still on its temporary password can do nothing but change it:
 * otherwise an admin-issued password, sent over chat or email, would stay a
 * working credential indefinitely.
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireStaff()
  if (user.mustChangePassword) throw new PasswordChangeRequiredError()
  if (!can(user.role, permission)) throw new ForbiddenError()
  return user
}

export class PasswordChangeRequiredError extends Error {
  constructor() {
    super('Password change required')
    this.name = 'PasswordChangeRequiredError'
  }
}

/**
 * Guard for routes restricted to particular staff roles.
 *
 * Most staff routes only need `requireStaff()`. This exists for the few
 * operations where the role genuinely matters — chiefly applying a correction
 * to a student's name, parents' names or date of birth, which rewrites what
 * certificate verification checks against. That is a registrar decision, not
 * something an editor updating notices should be able to do.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireStaff()
  if (user.mustChangePassword) throw new PasswordChangeRequiredError()
  // The administrator role holds every permission; see lib/permissions.ts.
  if (user.role !== 'admin' && !roles.includes(user.role)) throw new ForbiddenError()
  return user
}

export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden')
    this.name = 'ForbiddenError'
  }
}
