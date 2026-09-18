import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { rateLimit } from '@/lib/ratelimit'
import { requireStudent } from '@/lib/student-auth'
import { removeUpload, storeUpload } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/**
 * POST /api/student/photo — upload a replacement photograph for approval.
 *
 * The new photo goes to `pendingPhotoId`, NOT `photoId`. The current photo
 * stays on the record until a member of staff approves the replacement in
 * /admin. A student's own upload must not appear unreviewed beside their
 * marks on a page that looks like an official university document.
 *
 * Uploading again while one is pending replaces the pending one and deletes
 * the superseded file, so a student who uploads five times leaves one file
 * on disk, not five.
 */
export async function POST(req: Request) {
  let storedId: string | null = null

  try {
    const session = await requireStudent()

    // Per-student, not per-IP: a whole hostel on one connection should not
    // share a budget, but one account should not be able to fill the disk.
    const limit = await rateLimit('student-photo', session.id, 10, 60 * 60)
    if (!limit.allowed) {
      return fail('Too many uploads. Please try again later.', 429)
    }

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return fail('Could not read the upload.')
    }

    const file = form.get('photo')
    if (!(file instanceof File) || file.size === 0) return fail('Choose a photograph to upload.')

    const stored = await storeUpload(file, 'PHOTO')
    if (!stored.ok) return fail(stored.error)
    storedId = stored.id

    const previous = await db.student.findUnique({
      where: { id: session.id },
      select: { pendingPhotoId: true },
    })

    await db.student.update({
      where: { id: session.id },
      data: { pendingPhotoId: stored.id, pendingPhotoAt: new Date() },
    })
    storedId = null // committed; do not clean up below

    // Superseded pending upload is now unreferenced — remove it.
    if (previous?.pendingPhotoId) await removeUpload(previous.pendingPhotoId)

    return ok({ ok: true, pendingPhotoUrl: `/api/uploads/${stored.id}/` }, 201)
  } catch (e) {
    if (storedId) await removeUpload(storedId)
    return handleError(e)
  }
}

/** DELETE /api/student/photo — withdraw a pending photo before it is reviewed. */
export async function DELETE() {
  try {
    const session = await requireStudent()

    const student = await db.student.findUnique({
      where: { id: session.id },
      select: { pendingPhotoId: true },
    })
    if (!student?.pendingPhotoId) return ok({ ok: true })

    await db.student.update({
      where: { id: session.id },
      data: { pendingPhotoId: null, pendingPhotoAt: null },
    })
    await removeUpload(student.pendingPhotoId)

    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
