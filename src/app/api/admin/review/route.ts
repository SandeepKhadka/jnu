import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { requireStaff } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/review — everything waiting on a member of staff:
 * photographs awaiting approval, and open correction requests.
 */
export async function GET() {
  try {
    await requireStaff()

    const [photos, corrections] = await Promise.all([
      db.student.findMany({
        where: { pendingPhotoId: { not: null } },
        orderBy: { pendingPhotoAt: 'asc' },
        take: 100,
        select: {
          id: true,
          rollNo: true,
          fullName: true,
          programme: true,
          photoId: true,
          pendingPhotoId: true,
          pendingPhotoAt: true,
        },
      }),
      db.correctionRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 100,
        select: {
          id: true,
          field: true,
          currentValue: true,
          requestedValue: true,
          reason: true,
          createdAt: true,
          student: { select: { rollNo: true, fullName: true } },
        },
      }),
    ])

    return ok({
      photos: photos.map((p) => ({
        studentId: p.id,
        rollNo: p.rollNo,
        fullName: p.fullName,
        programme: p.programme,
        currentPhotoUrl: p.photoId ? `/api/uploads/${p.photoId}/` : null,
        pendingPhotoUrl: `/api/uploads/${p.pendingPhotoId}/`,
        submittedAt: p.pendingPhotoAt?.toISOString() ?? null,
      })),
      corrections: corrections.map((c) => ({
        id: c.id,
        field: c.field,
        currentValue: c.currentValue,
        requestedValue: c.requestedValue,
        reason: c.reason,
        createdAt: c.createdAt.toISOString(),
        rollNo: c.student.rollNo,
        fullName: c.student.fullName,
      })),
    })
  } catch (e) {
    return handleError(e)
  }
}
