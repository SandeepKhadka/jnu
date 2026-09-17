import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/audit — staff only. Append-only trail, newest first. */
export async function GET() {
  try {
    await requireStaff()
    const rows = await db.auditLog.findMany({ orderBy: { at: 'desc' }, take: 200 })
    return ok({ entries: rows })
  } catch (e) {
    return handleError(e)
  }
}
