import { db } from '@/lib/db'
import { ok, fail, handleError, readJson } from '@/lib/api'
import { getStudentSession, requireStudent } from '@/lib/student-auth'
import { isEmail, isIndianState, isPincode, normaliseMobile } from '@/lib/validate'

export const dynamic = 'force-dynamic'

/**
 * GET /api/student/me — the signed-in student's profile and published results.
 *
 * Returns `{ student: null }` rather than a 401 when nobody is signed in, so
 * the portal can render its signed-out state without treating a normal first
 * visit as an error.
 *
 * Everything is scoped by the session's own student id. There is no roll
 * number parameter, so one student cannot ask for another's record by
 * changing a value in the URL.
 */
export async function GET() {
  try {
    const session = await getStudentSession()
    if (!session) return ok({ student: null })

    const student = await db.student.findUnique({
      where: { id: session.id },
      // Explicit select: lockout counters and timestamps stay server-side.
      select: {
        rollNo: true,
        enrollmentNo: true,
        fullName: true,
        fatherName: true,
        motherName: true,
        dob: true,
        programme: true,
        photoId: true,
        pendingPhotoId: true,
        pendingPhotoAt: true,
        status: true,
        mobile: true,
        email: true,
        addressLine: true,
        district: true,
        state: true,
        pincode: true,
      },
    })
    if (!student) return ok({ student: null })

    const [results, corrections] = await Promise.all([
      db.result.findMany({
        // Match on the relation when set, and fall back to the roll number for
        // rows the exam cell imported before the register was populated.
        where: {
          published: true,
          OR: [{ studentId: session.id }, { studentId: null, rollNo: student.rollNo }],
        },
        orderBy: [{ examSession: 'desc' }, { semester: 'desc' }],
        select: {
          id: true,
          rollNo: true,
          studentName: true,
          programme: true,
          semester: true,
          examSession: true,
          subjects: true,
          marksObtained: true,
          marksMax: true,
          sgpa: true,
          status: true,
        },
      }),
      db.correctionRequest.findMany({
        where: { studentId: session.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          field: true,
          currentValue: true,
          requestedValue: true,
          status: true,
          staffRemarks: true,
          createdAt: true,
        },
      }),
    ])

    const { photoId, pendingPhotoId, pendingPhotoAt, ...rest } = student

    return ok({
      student: {
        ...rest,
        // The browser never receives a storage key — only a URL on the
        // authenticated uploads route.
        photoUrl: photoId ? `/api/uploads/${photoId}/` : null,
        pendingPhotoUrl: pendingPhotoId ? `/api/uploads/${pendingPhotoId}/` : null,
        pendingPhotoAt: pendingPhotoAt?.toISOString() ?? null,
      },
      results: results.map((r) => ({ ...r, subjects: JSON.parse(r.subjects) })),
      corrections: corrections.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * PATCH /api/student/me — update the student's own CONTACT details.
 *
 * Accepts exactly six fields and silently ignores anything else in the body.
 * That allow-list is the security boundary: the identity fields on Student
 * (name, parents' names, date of birth, roll and enrollment numbers) are what
 * certificate verification checks against, so a student who could PATCH
 * `fullName` could align their record to a forged certificate and have the
 * register confirm it. Those changes go through /api/student/corrections.
 *
 * Every field is optional and an empty string clears it, so a student can
 * remove a number they no longer use.
 */
export async function PATCH(req: Request) {
  try {
    const session = await requireStudent()

    const body = await readJson<Record<string, unknown>>(req)
    if (!body) return fail('Invalid request body.')

    const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : undefined)

    const data: {
      mobile?: string | null
      email?: string | null
      addressLine?: string | null
      district?: string | null
      state?: string | null
      pincode?: string | null
    } = {}

    const mobile = str('mobile')
    if (mobile !== undefined) {
      if (mobile === '') data.mobile = null
      else {
        const m = normaliseMobile(mobile)
        if (!m) return fail('Enter a valid 10-digit mobile number.')
        data.mobile = m
      }
    }

    const email = str('email')
    if (email !== undefined) {
      if (email === '') data.email = null
      else if (!isEmail(email) || email.length > 160) return fail('Enter a valid email address.')
      else data.email = email
    }

    const address = str('addressLine')
    if (address !== undefined) {
      if (address.length > 500) return fail('That address is too long.')
      data.addressLine = address || null
    }

    const district = str('district')
    if (district !== undefined) {
      if (district.length > 80) return fail('That district name is too long.')
      data.district = district || null
    }

    const state = str('state')
    if (state !== undefined) {
      if (state && !isIndianState(state)) return fail('Select a state or union territory.')
      data.state = state || null
    }

    const pincode = str('pincode')
    if (pincode !== undefined) {
      if (pincode && !isPincode(pincode)) return fail('Enter a valid 6-digit PIN code.')
      data.pincode = pincode || null
    }

    if (Object.keys(data).length === 0) return fail('Nothing to update.')

    await db.student.update({ where: { id: session.id }, data })

    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
