import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, requirePermission } from '@/lib/admin-route'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/students/[id]/unlock
 *
 * Clears the lockout after five failed sign-ins. Students who mistype their
 * own date of birth are the usual case, and the alternative is telling them
 * to wait fifteen minutes.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('students.edit')
    const { id } = await ctx.params
    const existing = await db.student.findUnique({ where: { id }, select: { rollNo: true } })
    if (!existing) return fail('Not found.', 404)
    await db.student.update({ where: { id }, data: { failedLogins: 0, lockedUntil: null } })
    await audit(user, 'student.unlock', existing.rollNo)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
