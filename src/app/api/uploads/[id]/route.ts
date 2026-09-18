import { ok, fail, handleError } from '@/lib/api'
import { getSessionUser } from '@/lib/auth'
import { getStudentSession } from '@/lib/student-auth'
import { db } from '@/lib/db'
import { etagFor, readUpload } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/uploads/[id] — serves an uploaded file to someone entitled to it.
 *
 * This route is the only way bytes leave the upload store, which is why the
 * store sits outside public/. Two callers are allowed:
 *
 *   - any signed-in member of staff, who processes applications and needs to
 *     see the Aadhaar and qualification documents attached to them;
 *   - a signed-in student, but ONLY for their own photographs (live or pending).
 *
 * Anything else is a 404 rather than a 403: confirming that an id exists but
 * is forbidden would let someone probe for valid ids.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || id.length > 40) return fail('Not found.', 404)

    const staff = await getSessionUser()
    let allowed = Boolean(staff)

    if (!allowed) {
      const student = await getStudentSession()
      if (student) {
        // A student may fetch only the photographs on their own record: the
        // live one, and a replacement they have uploaded that is awaiting
        // approval (so they can see what they sent).
        const own = await db.student.findUnique({
          where: { id: student.id },
          select: { photoId: true, pendingPhotoId: true },
        })
        allowed = own?.photoId === id || own?.pendingPhotoId === id
      }
    }

    if (!allowed) return fail('Not found.', 404)

    const file = await readUpload(id)
    if (!file) return fail('Not found.', 404)

    const etag = etagFor(id, file.bytes.length)
    if (req.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    return new Response(new Uint8Array(file.bytes), {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Length': String(file.bytes.length),
        ETag: etag,
        // Personal data: never store in a shared cache.
        'Cache-Control': 'private, no-store',
        // Always a download/inline render, never executed as a document.
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
