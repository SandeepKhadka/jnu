import { db } from '@/lib/db'
import { audit } from '@/lib/auth'
import { body, requirePermission, s as str } from '@/lib/admin-route'
import { marksProblem } from '@/lib/results-validate'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { newVerifyToken } from '@/lib/marksheet-token'

export const dynamic = 'force-dynamic'

/** PATCH /api/results/:id — staff only. Publishes or unpublishes a result. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('results.manage')
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

const STATUSES = ['PASS', 'FAIL', 'ATKT', 'WITHHELD']

/**
 * PUT /api/results/:id — edit a result.
 *
 * Only while UNPUBLISHED. A published result may already be printed as a
 * statement of marks carrying a serial and QR code; if the marks behind that
 * serial changed, the printed sheet would no longer match the record and
 * would read as altered to whoever checked it. Unpublish first — that already
 * reports the serial as withdrawn — then edit, then publish again.
 */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('results.manage')
    const { id } = await ctx.params
    const existing = await db.result.findUnique({ where: { id } })
    if (!existing) return fail('No such result.', 404)
    if (existing.published) {
      return fail(
        'Unpublish this result before editing it. A published result may already be printed with a serial that must keep matching the record.',
        409
      )
    }

    const input = await body(req)
    const status = str(input.status, 20).toUpperCase() || existing.status
    if (!STATUSES.includes(status)) return fail(`Status must be one of ${STATUSES.join(', ')}.`)

    const subjects = Array.isArray(input.subjects) ? input.subjects : JSON.parse(existing.subjects)
    const marksObtained = Number(input.marksObtained ?? existing.marksObtained) || 0
    const marksMax = Number(input.marksMax ?? existing.marksMax) || 0
    const problem = marksProblem({ marksObtained, marksMax, subjects }, existing.rollNo)
    if (problem) return fail(problem)

    const row = await db.result.update({
      where: { id },
      data: {
        studentName: str(input.studentName, 120) || existing.studentName,
        programme: str(input.programme, 160) || existing.programme,
        semester: str(input.semester, 60) || existing.semester,
        examSession: str(input.examSession, 60) || existing.examSession,
        subjects: JSON.stringify(subjects),
        marksObtained,
        marksMax,
        sgpa: Number(input.sgpa ?? existing.sgpa) || 0,
        status,
        // Any serial issued earlier is dropped: the figures behind it have
        // changed, so it must not keep verifying. Publishing issues a new one.
        verifyToken: null,
      },
    })

    await audit(
      user,
      'result.update',
      `${row.rollNo} — ${row.semester}${existing.verifyToken ? ' (previous serial retired)' : ''}`
    )
    return ok({ result: { ...row, subjects: JSON.parse(row.subjects) } })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/results/:id — staff only. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('results.manage')
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
