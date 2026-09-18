import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny } from '@/lib/admin-route'
import { noticeInput } from '@/lib/notice-input'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** PUT /api/admin/notices/[id] */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('content.edit')
    const { id } = await ctx.params
    if (!(await db.notice.findUnique({ where: { id }, select: { id: true } }))) return fail('Not found.', 404)
    const data = await noticeInput(await body(req))
    await db.notice.update({ where: { id }, data })
    await audit(user, 'notice.update', data.title)
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/admin/notices/[id] — the attached file stays in the media library. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('content.edit')
    const { id } = await ctx.params
    const existing = await db.notice.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)
    await db.notice.delete({ where: { id } })
    await audit(user, 'notice.delete', existing.title)
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
