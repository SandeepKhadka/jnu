import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, requirePermission, s } from '@/lib/admin-route'
import { studentInput } from '@/lib/student-input'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

/** GET /api/admin/students?q=&status=&page= */
export async function GET(req: Request) {
  try {
    await requirePermission('students.view')
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const status = url.searchParams.get('status') ?? ''
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)

    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { rollNo: { contains: q.toUpperCase() } },
              { enrollmentNo: { contains: q.toUpperCase() } },
              { fullName: { contains: q } },
            ],
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      db.student.findMany({
        where,
        orderBy: { rollNo: 'asc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          rollNo: true,
          enrollmentNo: true,
          fullName: true,
          programme: true,
          status: true,
          dob: true,
          lockedUntil: true,
          photoId: true,
          pendingPhotoId: true,
          _count: { select: { results: true, certificates: true } },
        },
      }),
      db.student.count({ where }),
    ])

    return ok({
      students: rows.map((r) => ({
        ...r,
        lockedUntil: r.lockedUntil?.toISOString() ?? null,
        photoUrl: r.photoId ? `/api/uploads/${r.photoId}/` : null,
        hasPendingPhoto: Boolean(r.pendingPhotoId),
        results: r._count.results,
        certificates: r._count.certificates,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
    })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/admin/students
 *   one student, or { rows: "csv text" } to import many.
 *
 * Import is all-or-nothing per row: a row that fails validation is reported
 * with its line number and skipped, and the rest still load. A half-imported
 * cohort with three silently mangled dates of birth would be worse than a
 * refusal, because those three students simply could not sign in.
 */
export async function POST(req: Request) {
  try {
    const user = await requirePermission('students.edit')
    const input = await body(req)

    if (typeof input.csv === 'string') {
      const { csvLine } = await import('@/lib/student-input')
      const lines = input.csv.split(/\r?\n/).filter((l) => l.trim())
      if (!lines.length) return fail('The file is empty.')

      const header = csvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''))
      const need = ['rollno', 'enrollmentno', 'fullname', 'fathername', 'mothername', 'dob', 'programme']
      const missing = need.filter((n) => !header.includes(n))
      if (missing.length) {
        return fail(
          `The CSV needs a header row with these columns: ${need.join(', ')}. Missing: ${missing.join(', ')}.`
        )
      }

      let created = 0
      let updated = 0
      const errors: string[] = []
      for (let i = 1; i < lines.length; i++) {
        const cells = csvLine(lines[i])
        const row: Record<string, unknown> = {}
        header.forEach((h, j) => {
          const key =
            { rollno: 'rollNo', enrollmentno: 'enrollmentNo', fullname: 'fullName', fathername: 'fatherName', mothername: 'motherName', addressline: 'addressLine' }[h] ?? h
          row[key] = cells[j] ?? ''
        })
        try {
          const data = studentInput(row)
          const existing = await db.student.findUnique({ where: { rollNo: data.rollNo } })
          if (existing) {
            await db.student.update({ where: { id: existing.id }, data })
            updated++
          } else {
            await db.student.create({ data })
            created++
          }
        } catch (err) {
          errors.push(`Line ${i + 1}: ${err instanceof Error ? err.message : 'could not be read'}`)
          if (errors.length > 20) break
        }
      }

      await audit(user, 'student.import', `${created} created, ${updated} updated, ${errors.length} skipped`)
      return ok({ created, updated, errors })
    }

    const data = studentInput(input)
    if (await db.student.findUnique({ where: { rollNo: data.rollNo } })) {
      return fail(`A student already exists with roll number ${data.rollNo}.`, 409)
    }
    if (await db.student.findUnique({ where: { enrollmentNo: data.enrollmentNo } })) {
      return fail(`A student already exists with enrollment number ${data.enrollmentNo}.`, 409)
    }
    const row = await db.student.create({ data })
    await audit(user, 'student.create', `${data.rollNo} — ${data.fullName}`)
    return ok({ id: row.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}
