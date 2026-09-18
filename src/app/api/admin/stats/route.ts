import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { requireStaff } from '@/lib/auth'
import { can } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats — the dashboard counters.
 *
 * Each figure is included only if the signed-in role may act on it, so the
 * dashboard never shows a number leading to a screen the person cannot open.
 */
export async function GET() {
  try {
    const user = await requireStaff()
    const out: Record<string, number> = {}

    if (can(user.role, 'applications.manage')) {
      out.applicationsNew = await db.application.count({ where: { status: 'SUBMITTED' } })
    }
    if (can(user.role, 'enquiries.manage')) {
      out.enquiriesOpen = await db.enquiry.count({ where: { handled: false } })
    }
    if (can(user.role, 'reviews.photos')) {
      out.photosPending = await db.student.count({ where: { pendingPhotoId: { not: null } } })
    }
    if (can(user.role, 'reviews.corrections')) {
      out.correctionsPending = await db.correctionRequest.count({ where: { status: 'PENDING' } })
    }
    if (can(user.role, 'results.manage')) {
      out.resultsUnpublished = await db.result.count({ where: { published: false } })
      out.resultsTotal = await db.result.count()
    }
    if (can(user.role, 'students.view')) {
      out.studentsActive = await db.student.count({ where: { status: 'ACTIVE' } })
    }
    if (can(user.role, 'certificates.view')) {
      out.certificates = await db.certificate.count({ where: { status: 'VERIFIED' } })
    }
    if (can(user.role, 'content.edit')) {
      out.pages = await db.page.count({ where: { published: true } })
      out.notices = await db.notice.count({ where: { published: true } })
    }
    if (can(user.role, 'programmes.edit')) {
      out.faculties = await db.faculty.count({ where: { published: true } })
      out.programmes = await db.programme.count({ where: { published: true } })
      out.facultiesEmpty = await db.faculty.count({ where: { published: true, programmes: { none: { published: true } } } })
    }
    if (can(user.role, 'staff.manage')) {
      out.staff = await db.staff.count({ where: { disabled: false } })
    }

    return ok({ stats: out, user: { fullName: user.fullName, role: user.role, email: user.email } })
  } catch (e) {
    return handleError(e)
  }
}
