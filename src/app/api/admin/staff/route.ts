import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requirePermission, s } from '@/lib/admin-route'
import { hashPassword } from '@/lib/auth'
import { isRole, roleLabel } from '@/lib/permissions'
import { temporaryPassword } from '@/lib/staff-password'

export const dynamic = 'force-dynamic'

/** GET /api/admin/staff */
export async function GET() {
  try {
    await requirePermission('staff.manage')
    const rows = await db.staff.findMany({
      orderBy: [{ disabled: 'asc' }, { fullName: 'asc' }],
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        disabled: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })
    return ok({
      staff: rows.map((r) => ({
        ...r,
        lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return handleError(e)
  }
}

/** POST /api/admin/staff — { email, fullName, role } → a one-time password. */
export async function POST(req: Request) {
  try {
    const user = await requirePermission('staff.manage')
    const input = await body(req)
    const email = s(input.email, 160).toLowerCase()
    const fullName = s(input.fullName, 120)
    const role = s(input.role, 20)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.')
    if (!fullName) return fail('Enter the person’s name.')
    if (!isRole(role)) return fail('Choose a role.')
    if (await db.staff.findUnique({ where: { email } })) return fail('An account already uses that email.', 409)

    const password = temporaryPassword()
    const row = await db.staff.create({
      data: { email, fullName, role, passwordHash: await hashPassword(password), mustChangePassword: true },
    })
    await audit(user, 'staff.create', `${email} as ${roleLabel(role)}`)
    // The only time this value exists in plain text.
    return ok({ id: row.id, password }, 201)
  } catch (e) {
    return handleError(e)
  }
}
