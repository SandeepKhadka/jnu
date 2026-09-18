import { db } from '@/lib/db'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { audit, requireRole } from '@/lib/auth'
import { removeUpload } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/photos/[studentId] — { action: 'approve' | 'reject' }
 *
 * Registrar or exam cell. Approving promotes the pending photo to the live
 * one and deletes the photo it replaces; rejecting deletes the pending one
 * and leaves the live photo untouched. Either way exactly one photograph per
 * student remains on disk.
 */
export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const user = await requireRole('registrar', 'exam_cell')
    const { studentId } = await params

    const body = await readJson<{ action?: string }>(req)
    const action = body?.action
    if (action !== 'approve' && action !== 'reject') return fail('Unknown action.')

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { rollNo: true, photoId: true, pendingPhotoId: true },
    })
    if (!student) return fail('Student not found.', 404)
    if (!student.pendingPhotoId) return fail('There is no photograph awaiting review.', 409)

    if (action === 'approve') {
      await db.student.update({
        where: { id: studentId },
        data: { photoId: student.pendingPhotoId, pendingPhotoId: null, pendingPhotoAt: null },
      })
      if (student.photoId) await removeUpload(student.photoId)
      await audit(user, 'photo.approve', `Approved new photograph for ${student.rollNo}`)
    } else {
      await db.student.update({
        where: { id: studentId },
        data: { pendingPhotoId: null, pendingPhotoAt: null },
      })
      await removeUpload(student.pendingPhotoId)
      await audit(user, 'photo.reject', `Rejected photograph submitted by ${student.rollNo}`)
    }

    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
