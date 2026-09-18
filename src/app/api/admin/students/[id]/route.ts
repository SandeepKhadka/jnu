import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requirePermission } from '@/lib/admin-route'
import { studentInput } from '@/lib/student-input'

export const dynamic = 'force-dynamic'

/** GET /api/admin/students/[id] — the full record, with results and degrees. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('students.view')
    const { id } = await ctx.params
    const row = await db.student.findUnique({
      where: { id },
      include: {
        results: { orderBy: [{ examSession: 'desc' }, { semester: 'desc' }], select: { id: true, semester: true, examSession: true, status: true, published: true, marksObtained: true, marksMax: true } },
        certificates: { select: { id: true, certificateNo: true, status: true, awardYear: true, programme: true } },
        corrections: { where: { status: 'PENDING' }, select: { id: true, field: true } },
      },
    })
    if (!row) return fail('Not found.', 404)

    const { photoId, pendingPhotoId, ...rest } = row
    return ok({
      student: {
        ...rest,
        lockedUntil: row.lockedUntil?.toISOString() ?? null,
        lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        photoUrl: photoId ? `/api/uploads/${photoId}/` : null,
        pendingPhotoUrl: pendingPhotoId ? `/api/uploads/${pendingPhotoId}/` : null,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}

/** PUT /api/admin/students/[id] */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('students.edit')
    const { id } = await ctx.params
    const existing = await db.student.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const data = studentInput(await body(req))

    const byRoll = await db.student.findUnique({ where: { rollNo: data.rollNo }, select: { id: true } })
    if (byRoll && byRoll.id !== id) return fail(`Roll number ${data.rollNo} belongs to another student.`, 409)
    const byEnrol = await db.student.findUnique({ where: { enrollmentNo: data.enrollmentNo }, select: { id: true } })
    if (byEnrol && byEnrol.id !== id) return fail(`Enrollment number ${data.enrollmentNo} belongs to another student.`, 409)

    await db.student.update({ where: { id }, data })

    // Identity changes are what certificate verification checks against, so
    // the audit line records the before and after, not just "updated".
    const changes = (['rollNo', 'fullName', 'fatherName', 'motherName', 'dob', 'programme', 'status'] as const)
      .filter((k) => existing[k] !== data[k])
      .map((k) => `${k}: "${existing[k]}" → "${data[k]}"`)
    await audit(
      user,
      'student.update',
      changes.length ? `${data.rollNo} — ${changes.join('; ')}` : `${data.rollNo} (contact details)`
    )
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * DELETE /api/admin/students/[id]
 *
 * Refused once a degree has been issued: the certificate register verifies by
 * roll number and date of birth, and deleting the student would make a
 * genuine degree fail verification. Mark them WITHDRAWN instead.
 */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('students.delete')
    const { id } = await ctx.params
    const existing = await db.student.findUnique({
      where: { id },
      include: { _count: { select: { certificates: true, results: true } } },
    })
    if (!existing) return fail('Not found.', 404)
    if (existing._count.certificates > 0) {
      return fail(
        `${existing.rollNo} holds ${existing._count.certificates} certificate(s). Deleting the student would stop those degrees verifying. Set the status to Withdrawn instead.`,
        409
      )
    }
    await db.student.delete({ where: { id } })
    await audit(
      user,
      'student.delete',
      `${existing.rollNo} — ${existing.fullName}${existing._count.results ? ` (${existing._count.results} result rows kept)` : ''}`
    )
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
