import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requirePermission, s } from '@/lib/admin-route'

export const dynamic = 'force-dynamic'

const STATUSES = ['NEW', 'CONTACTED', 'CLOSED']

/** PATCH /api/counselling/[id] — { status, remarks } */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('counselling.manage')
    const { id } = await ctx.params
    const existing = await db.counselling.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const input = await body(req)
    const status = s(input.status, 20).toUpperCase() || existing.status
    if (!STATUSES.includes(status)) return fail('Unknown status.')
    const remarks = s(input.remarks, 500)

    await db.counselling.update({ where: { id }, data: { status, remarks: remarks || null } })
    await audit(user, 'counselling.status', `${existing.reference} → ${status}${remarks ? `: ${remarks}` : ''}`)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * DELETE /api/counselling/[id]
 *
 * Unlike an admission application, a counselling lead has no academic
 * consequence, and it may carry an identity document belonging to someone
 * who never enrolled. Being able to erase it is how the office honours an
 * erasure request under the DPDP Act, so the uploads go with the row.
 */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('counselling.manage')
    const { id } = await ctx.params
    const existing = await db.counselling.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    // Imported lazily: lib/storage is server-only and touches the disk, and
    // nothing else in this route needs it.
    const { removeUpload } = await import('@/lib/storage')
    await db.counselling.delete({ where: { id } })
    for (const uploadId of [existing.photoId, existing.aadhaarId]) {
      if (uploadId) await removeUpload(uploadId)
    }

    await audit(user, 'counselling.delete', existing.reference)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
