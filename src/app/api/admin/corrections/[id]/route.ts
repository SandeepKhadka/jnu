import { db } from '@/lib/db'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { audit, requireRole } from '@/lib/auth'
import { CORRECTABLE_FIELDS, isCorrectableField } from '@/lib/corrections'
import { normaliseDob } from '@/lib/student-auth'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/corrections/[id] — { action: 'apply' | 'reject', remarks? }
 *
 * REGISTRAR ONLY. Applying a correction rewrites a student's name, a parent's
 * name, their date of birth or their programme — the fields certificate
 * verification checks against. That is the most consequential edit in the
 * system and belongs to one role.
 *
 * What this deliberately does NOT do: rewrite the copies of the name held on
 * Result and Certificate rows. Those record what was issued. A certificate
 * printed with the old spelling is still a certificate printed with the old
 * spelling, and silently changing the register entry would make verification
 * disagree with the document in the holder's hand. Reissuing is a separate
 * registrar act, recorded on the certificate itself.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('registrar')
    const { id } = await params

    const body = await readJson<{ action?: string; remarks?: string }>(req)
    const action = body?.action
    if (action !== 'apply' && action !== 'reject') return fail('Unknown action.')
    const remarks = body?.remarks?.trim().slice(0, 500) || null

    const request = await db.correctionRequest.findUnique({
      where: { id },
      include: { student: { select: { id: true, rollNo: true } } },
    })
    if (!request) return fail('Request not found.', 404)
    if (request.status !== 'PENDING') return fail('This request has already been dealt with.', 409)
    if (!isCorrectableField(request.field)) return fail('That field cannot be corrected here.')

    if (action === 'reject') {
      if (!remarks) return fail('Give the student a reason for the rejection.')
      await db.correctionRequest.update({
        where: { id },
        data: { status: 'REJECTED', staffRemarks: remarks, resolvedAt: new Date() },
      })
      await audit(
        user,
        'correction.reject',
        `Rejected ${request.field} correction for ${request.student.rollNo}`
      )
      return ok({ ok: true })
    }

    // A date of birth is half the login credential; refuse anything the login
    // route would then be unable to match, or the student is locked out.
    let value = request.requestedValue
    if (request.field === 'dob') {
      const d = normaliseDob(value)
      if (!d) return fail('The requested date of birth is not a valid YYYY-MM-DD date.')
      value = d
    }

    await db.$transaction([
      db.student.update({
        where: { id: request.student.id },
        data: { [request.field]: value },
      }),
      db.correctionRequest.update({
        where: { id },
        data: { status: 'RESOLVED', staffRemarks: remarks, resolvedAt: new Date() },
      }),
    ])

    // Both values go into the audit line: this is the edit someone will one
    // day need to account for.
    await audit(
      user,
      'correction.apply',
      `${CORRECTABLE_FIELDS[request.field]} for ${request.student.rollNo}: ` +
        `"${request.currentValue}" -> "${value}"`
    )

    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
