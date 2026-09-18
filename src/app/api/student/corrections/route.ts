import { db } from '@/lib/db'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { requireStudent } from '@/lib/student-auth'
import { CORRECTABLE_FIELDS, isCorrectableField } from '@/lib/corrections'

export const dynamic = 'force-dynamic'

/** POST /api/student/corrections — { field, requestedValue, reason? } */
export async function POST(req: Request) {
  try {
    const session = await requireStudent()

    const body = await readJson<{ field?: string; requestedValue?: string; reason?: string }>(req)
    if (!body) return fail('Invalid request body.')

    const field = body.field
    if (!isCorrectableField(field)) return fail('That field cannot be corrected here.')

    const requestedValue = body.requestedValue?.trim() ?? ''
    if (!requestedValue) return fail('Enter the correct value.')
    if (requestedValue.length > 120) return fail('That value is too long.')

    const reason = body.reason?.trim().slice(0, 500) || null

    const student = await db.student.findUnique({
      where: { id: session.id },
      select: { fullName: true, fatherName: true, motherName: true, dob: true, programme: true },
    })
    if (!student) return fail('Not signed in.', 401)

    const currentValue = student[field]
    if (currentValue === requestedValue) {
      return fail('That is already the value on your record.')
    }

    // One open request per field. Otherwise a student can queue ten
    // contradictory requests for the same name and leave staff to guess which
    // one they meant.
    const open = await db.correctionRequest.findFirst({
      where: { studentId: session.id, field, status: 'PENDING' },
      select: { id: true },
    })
    if (open) {
      return fail(
        `You already have a pending request for ${CORRECTABLE_FIELDS[field].toLowerCase()}. ` +
          'Please wait for it to be reviewed.'
      )
    }

    await db.correctionRequest.create({
      data: { studentId: session.id, field, currentValue, requestedValue, reason },
    })

    return ok({ ok: true }, 201)
  } catch (e) {
    return handleError(e)
  }
}
