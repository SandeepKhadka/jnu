import 'server-only'

import { audit, requirePermission, requireStaff, ForbiddenError, PasswordChangeRequiredError, type SessionUser } from '@/lib/auth'
import { can, type Permission } from '@/lib/permissions'

/**
 * Small helpers shared by the admin API routes.
 */

/** Signed in with ANY of these permissions. */
export async function requireAny(...permissions: Permission[]): Promise<SessionUser> {
  const user = await requireStaff()
  if (user.mustChangePassword) throw new PasswordChangeRequiredError()
  if (!permissions.some((p) => can(user.role, p))) throw new ForbiddenError()
  return user
}

export { requirePermission, audit }

/** Reads a JSON body into a plain object, or {} — never throws. */
export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const v = await req.json()
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function s(v: unknown, max = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export function b(v: unknown): boolean {
  return v === true || v === 'true' || v === 'on' || v === 1
}

export function int(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : Number.parseInt(String(v ?? ''), 10)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** #rrggbb or null. */
export function colour(v: unknown): string | null {
  const c = s(v, 7)
  return /^#[0-9a-f]{6}$/i.test(c) ? c : null
}

/** Thrown for an input problem the admin should see verbatim. */
export class InputError extends Error {}
