import { db } from '@/lib/db'
import { requireStaff, audit } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { newVerifyToken } from '@/lib/marksheet-token'

export const dynamic = 'force-dynamic'

/** PATCH /api/results/:id — staff only. Publishes or unpublishes a result. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireStaff()
    const { id } = await ctx.params
    const body = await readJson<{ published?: boolean }>(req)
    if (typeof body?.published !== 'boolean') return fail('`published` must be true or false.')

    const existing = await db.result.findUnique({ where: { id } })
    if (!existing) return fail('No such result.', 404)

    const row = await db.result.update({
      where: { id },
      data: {
        published: body.published,
        publishedAt: body.published ? new Date() : null,
        // The serial is issued on first publication and then kept for good,
        // including across unpublish/republish: a sheet already printed with
        // it must still verify against the same record.
        ...(body.published && !existing.verifyToken ? { verifyToken: newVerifyToken() } : {}),
      },
    })

    await audit(
      user,
      body.published ? 'result.publish' : 'result.unpublish',
      `${row.rollNo} — ${row.semester}`
    )
    return ok({ result: { ...row, subjects: JSON.parse(row.subjects) } })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/results/:id — staff only. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireStaff()
    const { id } = await ctx.params

    const existing = await db.result.findUnique({ where: { id } })
    if (!existing) return fail('No such result.', 404)

    await db.result.delete({ where: { id } })
    await audit(user, 'result.delete', `${existing.rollNo} — ${existing.semester}`)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
