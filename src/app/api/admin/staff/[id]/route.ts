import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, b, body, requirePermission, s } from '@/lib/admin-route'
import { hashPassword } from '@/lib/auth'
import { isRole, roleLabel } from '@/lib/permissions'
import { temporaryPassword } from '@/lib/staff-password'

export const dynamic = 'force-dynamic'

/** Would this change leave the system with no way back in? */
async function lastAdminGuard(id: string, nextRole: string, nextDisabled: boolean): Promise<string | null> {
  const target = await db.staff.findUnique({ where: { id }, select: { role: true, disabled: true } })
  if (!target || target.role !== 'admin' || target.disabled) return null
  const stillAdmin = nextRole === 'admin' && !nextDisabled
  if (stillAdmin) return null
  const others = await db.staff.count({ where: { role: 'admin', disabled: false, id: { not: id } } })
  return others > 0
    ? null
    : 'This is the only active administrator. Promote someone else first, or nobody will be able to manage the site.'
}

/** PUT /api/admin/staff/[id] — { fullName, role, disabled } */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('staff.manage')
    const { id } = await ctx.params
    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const input = await body(req)
    const fullName = s(input.fullName, 120) || existing.fullName
    const role = s(input.role, 20) || existing.role
    const disabled = b(input.disabled)
    if (!isRole(role)) return fail('Choose a role.')

    // Changing your own role or disabling yourself is how an administrator
    // locks themselves out mid-session.
    if (id === user.id && (role !== existing.role || disabled)) {
      return fail('You cannot change your own role or disable your own account.', 409)
    }
    const guard = await lastAdminGuard(id, role, disabled)
    if (guard) return fail(guard, 409)

    await db.staff.update({ where: { id }, data: { fullName, role, disabled } })
    const changes = [
      existing.fullName !== fullName ? `name → ${fullName}` : '',
      existing.role !== role ? `role → ${roleLabel(role)}` : '',
      existing.disabled !== disabled ? (disabled ? 'disabled' : 're-enabled') : '',
    ].filter(Boolean)
    await audit(user, 'staff.update', `${existing.email}${changes.length ? `: ${changes.join(', ')}` : ''}`)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/admin/staff/[id] — audit entries are kept; the actor becomes null. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('staff.manage')
    const { id } = await ctx.params
    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)
    if (id === user.id) return fail('You cannot delete your own account.', 409)
    const guard = await lastAdminGuard(id, 'none', true)
    if (guard) return fail(guard, 409)

    await db.staff.delete({ where: { id } })
    await audit(user, 'staff.delete', existing.email)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** POST /api/admin/staff/[id] — reset the password; returns a one-time value. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('staff.manage')
    const { id } = await ctx.params
    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const password = temporaryPassword()
    await db.staff.update({
      where: { id },
      data: { passwordHash: await hashPassword(password), mustChangePassword: true },
    })
    await audit(user, 'staff.reset', existing.email)
    return ok({ password })
  } catch (e) {
    return handleError(e)
  }
}
