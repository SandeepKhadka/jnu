import { ok, handleError } from '@/lib/api'
import { requireAny } from '@/lib/admin-route'
import { getFacultiesAdmin } from '@/lib/content'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/programme-names — programme names grouped by faculty.
 *
 * For the result and certificate screens, which need to pick a programme but
 * have no business editing the catalogue: the exam cell can read this without
 * holding programmes.edit.
 */
export async function GET() {
  try {
    await requireAny('results.manage', 'certificates.view', 'students.edit', 'programmes.edit')
    const faculties = await getFacultiesAdmin()
    return ok({
      faculties: faculties.map((f) => ({
        faculty: f.name,
        programmes: f.programmes.map((p) => p.name),
      })),
    })
  } catch (e) {
    return handleError(e)
  }
}
