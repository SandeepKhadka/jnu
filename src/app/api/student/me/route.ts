import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { getStudentSession } from '@/lib/student-auth'

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
        status: true,
      },
    })
    if (!student) return ok({ student: null })

    const results = await db.result.findMany({
      // Match on the relation when it is set, and fall back to the roll number
      // for rows the exam cell imported before the register was populated.
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
    })

    return ok({
      student: {
        ...student,
        // The browser never receives a storage key, only whether a photo
        // exists; the image itself comes from /api/uploads/<id>.
        photoUrl: student.photoId ? `/api/uploads/${student.photoId}/` : null,
        photoId: undefined,
      },
      results: results.map((r) => ({ ...r, subjects: JSON.parse(r.subjects) })),
    })
  } catch (e) {
    return handleError(e)
  }
}
