import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requirePermission, s } from '@/lib/admin-route'
import { studentInput } from '@/lib/student-input'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/applications/[id]/enroll — { rollNo, enrollmentNo, programme? }
 *
 * Turns an accepted application into a student record: name, parents, date of
 * birth, contact details and the uploaded photograph carry across, so nothing
 * is re-typed and the date of birth the student already gave stays exactly as
 * it was — it is half of their login.
 *
 * The photograph is attached as APPROVED: it came through the admissions
 * office with the application, not from the student's own upload.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('students.edit')
    const { id } = await ctx.params
    const app = await db.application.findUnique({ where: { id } })
    if (!app) return fail('Not found.', 404)
    if (app.status !== 'ACCEPTED') return fail('Accept the application before enrolling the student.', 409)

    const input = await body(req)
    const data = studentInput({
      rollNo: s(input.rollNo, 24),
      enrollmentNo: s(input.enrollmentNo, 40),
      fullName: app.fullName,
      fatherName: app.fatherName,
      motherName: app.motherName,
      dob: app.dob,
      programme: s(input.programme, 160) || app.programme,
      status: 'ACTIVE',
      mobile: app.mobile,
      email: app.email,
      addressLine: app.address,
      district: app.district,
      state: app.state,
      pincode: app.pincode,
    })

    if (await db.student.findUnique({ where: { rollNo: data.rollNo } })) {
      return fail(`A student already exists with roll number ${data.rollNo}.`, 409)
    }
    if (await db.student.findUnique({ where: { enrollmentNo: data.enrollmentNo } })) {
      return fail(`A student already exists with enrollment number ${data.enrollmentNo}.`, 409)
    }

    const student = await db.student.create({ data: { ...data, photoId: app.photoId } })
    await audit(
      user,
      'student.enroll',
      `${data.rollNo} — ${data.fullName} from application ${app.applicationNo}`
    )
    return ok({ id: student.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}
