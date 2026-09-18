/**
 * DEMO DATA — fictional students, results and certificates for local testing.
 *
 *   npm run db:seed:demo
 *
 * Refuses to run when NODE_ENV=production. The dates of birth below are half
 * of a student login credential and are published in this repository, so
 * they must never exist in a live database.
 *
 * Creates no staff accounts: use `npm run admin:create`.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedResults, seedCertificates, seedStudents } from './demo-data'

const db = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to load demo data with NODE_ENV=production.')
    process.exit(1)
  }

  // ---- students ----
  //
  // Seeded BEFORE results and certificates, because both link back to a
  // student row by roll number and the link is resolved as they are written.
  for (const st of seedStudents) {
    const data = {
      rollNo: st.roll_no,
      enrollmentNo: st.enrollment_no,
      fullName: st.full_name,
      fatherName: st.father_name,
      motherName: st.mother_name,
      dob: st.dob,
      programme: st.programme,
      status: st.status,
      // Clear any lockout left over from testing a failed sign-in.
      failedLogins: 0,
      lockedUntil: null,
    }
    await db.student.upsert({ where: { rollNo: st.roll_no }, update: data, create: data })
  }
  console.log(`students:     ${seedStudents.length}`)

  const studentIdByRoll = new Map(
    (await db.student.findMany({ select: { id: true, rollNo: true } })).map((s) => [s.rollNo, s.id])
  )
  const rollByCertificate = new Map<string, string>()
  for (const st of seedStudents) {
    for (const no of st.certificates ?? []) rollByCertificate.set(no, st.roll_no)
  }

  // ---- results ----
  for (const r of seedResults) {
    const key = {
      rollNo_semester_examSession: {
        rollNo: r.roll_no,
        semester: r.semester,
        examSession: r.exam_session,
      },
    }
    const data = {
      rollNo: r.roll_no,
      studentName: r.student_name,
      programme: r.programme,
      semester: r.semester,
      examSession: r.exam_session,
      subjects: JSON.stringify(r.subjects),
      marksObtained: r.marks_obtained,
      marksMax: r.marks_max,
      sgpa: r.sgpa,
      status: r.status,
      studentId: studentIdByRoll.get(r.roll_no) ?? null,
      published: r.published,
      publishedAt: r.published_at ? new Date(r.published_at) : null,
    }
    await db.result.upsert({ where: key, update: data, create: data })
  }
  console.log(`results:      ${seedResults.length}`)

  // ---- certificates ----
  for (const c of seedCertificates) {
    const data = {
      certificateNo: c.certificate_no,
      studentName: c.student_name,
      programme: c.programme,
      awardYear: c.award_year,
      enrollmentNo: c.enrollment_no,
      division: c.division,
      status: c.status,
      registrarRemarks: c.registrar_remarks ?? null,
      issuedOn: new Date(`${c.issued_on}T00:00:00Z`),
      rollNo: rollByCertificate.get(c.certificate_no) ?? null,
      studentId: studentIdByRoll.get(rollByCertificate.get(c.certificate_no) ?? "") ?? null,
    }
    await db.certificate.upsert({
      where: { certificateNo: c.certificate_no },
      update: data,
      create: data,
    })
  }
  console.log(`certificates: ${seedCertificates.length}`)
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
