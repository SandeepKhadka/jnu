import { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import { requireStaff, audit } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/results — staff only. Full list including unpublished drafts. */
export async function GET() {
  try {
    await requireStaff()
    const rows = await db.result.findMany({ orderBy: { rollNo: 'asc' }, take: 500 })
    return ok({ results: rows.map((r) => ({ ...r, subjects: JSON.parse(r.subjects) })) })
  } catch (e) {
    return handleError(e)
  }
}

type NewResult = {
  rollNo?: string
  studentName?: string
  programme?: string
  semester?: string
  examSession?: string
  marksObtained?: number
  marksMax?: number
  sgpa?: number
  status?: string
  subjects?: unknown[]
}

const STATUSES = ['PASS', 'FAIL', 'ATKT', 'WITHHELD']

/**
 * POST /api/results — staff only. Creates one result, or many when `rows` is
 * supplied (CSV import).
 *
 * Everything is created unpublished regardless of what the client sends, so a
 * bad import can be corrected before any student sees it.
 */
export async function POST(req: Request) {
  try {
    const user = await requireStaff()
    const body = await readJson<NewResult & { rows?: NewResult[] }>(req)
    if (!body) return fail('Invalid request body.')

    const incoming = body.rows ?? [body]
    if (incoming.length === 0) return fail('No rows supplied.')
    if (incoming.length > 500) return fail('Import is limited to 500 rows at a time.')

    const data: Prisma.ResultCreateManyInput[] = []
    for (const r of incoming) {
      if (!r.rollNo?.trim() || !r.studentName?.trim()) {
        return fail('Every row needs a roll number and a student name.')
      }
      if (!r.semester?.trim() || !r.examSession?.trim()) {
        return fail('Every row needs a semester and an exam session.')
      }
      const status = (r.status ?? 'PASS').toUpperCase()
      if (!STATUSES.includes(status)) {
        return fail(`Status must be one of ${STATUSES.join(', ')}.`)
      }

      data.push({
        rollNo: r.rollNo.trim().toUpperCase(),
        studentName: r.studentName.trim(),
        programme: r.programme?.trim() ?? '',
        semester: r.semester.trim(),
        examSession: r.examSession.trim(),
        subjects: JSON.stringify(Array.isArray(r.subjects) ? r.subjects : []),
        marksObtained: Number(r.marksObtained) || 0,
        marksMax: Number(r.marksMax) || 0,
        sgpa: Number(r.sgpa) || 0,
        status,
        published: false,
      })
    }

    // SQLite does not support createMany({ skipDuplicates }), so rows are
    // inserted individually and a duplicate is skipped rather than failing the
    // whole import — a half-loaded semester is more useful than none.
    let created = 0
    let skipped = 0

    for (const row of data) {
      try {
        await db.result.create({ data: row })
        created++
      } catch (err) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
          skipped++
          continue
        }
        throw err
      }
    }

    await audit(
      user,
      incoming.length > 1 ? 'result.import' : 'result.create',
      `${created} row(s) created as drafts, ${skipped} duplicate(s) skipped`
    )

    if (created === 0 && skipped > 0) {
      return fail('A result already exists for that roll number, semester and session.', 409)
    }

    return ok({ created, skipped }, 201)
  } catch (e) {
    return handleError(e)
  }
}
