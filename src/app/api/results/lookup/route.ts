import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/results/lookup?roll=JNU2024BT0147 — public, no session needed.
 *
 * The `published: true` filter is applied server-side, so an unpublished
 * result can never reach the browser at all. That is the substantive change
 * from the localStorage version: previously every row was in the client
 * bundle and only the UI hid the drafts.
 *
 * The caller cannot tell "no such roll number" from "not yet published" —
 * both return an empty list. If they differed, anyone could enumerate which
 * roll numbers are enrolled.
 */
export async function GET(req: Request) {
  try {
    const roll = new URL(req.url).searchParams.get('roll')?.trim().toUpperCase()
    if (!roll) return fail('A roll number is required.')
    if (roll.length > 24) return fail('That roll number is too long.')

    const rows = await db.result.findMany({
      where: { rollNo: roll, published: true },
      orderBy: { semester: 'desc' },
      // Explicit select: never return internal ids or timestamps to the public.
      select: {
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
      results: rows.map((r) => ({ ...r, subjects: JSON.parse(r.subjects) })),
    })
  } catch (e) {
    return handleError(e)
  }
}
