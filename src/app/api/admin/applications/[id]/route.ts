import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requirePermission, s } from '@/lib/admin-route'

export const dynamic = 'force-dynamic'

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED']

/** GET /api/admin/applications/[id] — full application with its documents. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('applications.manage')
    const { id } = await ctx.params
    const row = await db.application.findUnique({ where: { id } })
    if (!row) return fail('Not found.', 404)
    const { photoId, aadhaarId, qualificationDocId, ...rest } = row
    return ok({
      application: {
        ...rest,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        // Documents are served by /api/uploads, which checks the session
        // again — the ids alone grant nothing.
        photoUrl: photoId ? `/api/uploads/${photoId}/` : null,
        aadhaarUrl: aadhaarId ? `/api/uploads/${aadhaarId}/` : null,
        qualificationUrl: qualificationDocId ? `/api/uploads/${qualificationDocId}/` : null,
        enrolled: Boolean(await db.student.findFirst({ where: { email: row.email, dob: row.dob }, select: { id: true } })),
      },
    })
  } catch (e) {
    return handleError(e)
  }
}

/** PATCH /api/admin/applications/[id] — { status, remarks } */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('applications.manage')
    const { id } = await ctx.params
    const existing = await db.application.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const input = await body(req)
    const status = s(input.status, 20).toUpperCase() || existing.status
    if (!STATUSES.includes(status)) return fail('Unknown status.')
    const remarks = s(input.remarks, 500)
    if (status === 'REJECTED' && !remarks) return fail('Record a reason when rejecting an application.')

    await db.application.update({ where: { id }, data: { status, remarks: remarks || null } })
    await audit(user, 'application.status', `${existing.applicationNo} → ${status}${remarks ? `: ${remarks}` : ''}`)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
