/**
 * Seeds the database from content/seed.ts, so the demo data that previously
 * lived in the browser now lives in the real database.
 *
 * Idempotent: re-running updates existing rows rather than duplicating them,
 * so `npm run db:seed` is safe to run any time.
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { seedResults, seedCertificates, demoStaff } from '../content/seed'

const db = new PrismaClient()

async function main() {
  // ---- staff ----
  for (const s of demoStaff) {
    const passwordHash = await bcrypt.hash(s.password, 12)
    await db.staff.upsert({
      where: { email: s.email },
      update: { fullName: s.full_name, role: s.role, passwordHash },
      create: { email: s.email, fullName: s.full_name, role: s.role, passwordHash },
    })
  }
  console.log(`staff:        ${demoStaff.length}`)

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
