import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, b, body, requirePermission } from '@/lib/admin-route'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/enquiries/[id] — { handled } */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('enquiries.manage')
    const { id } = await ctx.params
    const existing = await db.enquiry.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)
    const handled = b((await body(req)).handled)
    await db.enquiry.update({ where: { id }, data: { handled } })
    await audit(user, handled ? 'enquiry.handled' : 'enquiry.reopened', `${existing.name} <${existing.email}>`)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/admin/enquiries/[id] */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('enquiries.manage')
    const { id } = await ctx.params
    const existing = await db.enquiry.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)
    await db.enquiry.delete({ where: { id } })
    await audit(user, 'enquiry.delete', `${existing.name} <${existing.email}>`)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
