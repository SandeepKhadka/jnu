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
 * Rejects marks that cannot be true.
 *
 * A published result now prints as a statement of marks carrying a serial the
 * public can verify, so an impossible figure is not a display glitch: it is a
 * university document asserting something false, with the university's own
 * verification service confirming it. The seed data shipped with "88 out of
 * 50" in a laboratory paper for months before the printed sheet made it
 * obvious; nothing downstream would ever have caught it.
 *
 * When subjects are supplied, the grand total must be their sum. It is
 * rejected rather than silently recomputed — a total that disagrees with its
 * own rows means the import is wrong somewhere, and the exam cell needs to
 * know which row rather than have it papered over.
 */
function marksProblem(r: NewResult, label: string): string | null {
  const obtained = Number(r.marksObtained) || 0
  const max = Number(r.marksMax) || 0
  if (obtained < 0 || max < 0) return `${label}: marks cannot be negative.`
  if (obtained > max) return `${label}: total obtained (${obtained}) exceeds the maximum (${max}).`

  const subjects = Array.isArray(r.subjects) ? (r.subjects as Record<string, unknown>[]) : []
  if (subjects.length === 0) return null

  let sumObtained = 0
  let sumMax = 0
  for (const sub of subjects) {
    const name = String(sub.code ?? sub.name ?? 'a subject')
    const o = Number(sub.obtained)
    const m = Number(sub.max)
    if (!Number.isFinite(o) || !Number.isFinite(m) || m <= 0) {
      return `${label}: ${name} needs numeric obtained and maximum marks.`
    }
    if (o < 0 || o > m) return `${label}: ${name} has ${o} out of ${m}.`

    const hasSplit = sub.theory !== undefined || sub.practical !== undefined
    if (hasSplit) {
      const t = Number(sub.theory ?? 0)
      const pr = Number(sub.practical ?? 0)
      if (t < 0 || pr < 0 || t + pr !== o) {
        return `${label}: ${name} theory (${t}) + practical (${pr}) must equal ${o}.`
      }
    }
    sumObtained += o
    sumMax += m
  }

  if (sumObtained !== obtained || sumMax !== max) {
    return (
      `${label}: grand total ${obtained}/${max} does not match the subjects, ` +
      `which add up to ${sumObtained}/${sumMax}.`
    )
  }
  return null
}

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
    for (const [i, r] of incoming.entries()) {
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

      const label = incoming.length > 1 ? `Row ${i + 1} (${r.rollNo.trim()})` : r.rollNo.trim()
      const problem = marksProblem(r, label)
      if (problem) return fail(problem)

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
