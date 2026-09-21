import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-route'
import { ok, handleError } from '@/lib/api'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

/**
 * GET /api/audit?q=&page= — staff only. Append-only trail, newest first.
 *
 * Paginated rather than capped at 200: the trail is the record you reach for
 * when something looks wrong, and "the first 200 entries" is exactly the wrong
 * window when the thing you are looking for happened last term.
 */
export async function GET(req: Request) {
  try {
    await requirePermission('audit.view')
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)

    const where = q
      ? {
          OR: [
            { actorEmail: { contains: q } },
            { action: { contains: q } },
            { detail: { contains: q } },
          ],
        }
      : {}

    const [rows, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { at: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.auditLog.count({ where }),
    ])

    return ok({ entries: rows, total, pageSize: PAGE_SIZE })
  } catch (e) {
    return handleError(e)
  }
}
