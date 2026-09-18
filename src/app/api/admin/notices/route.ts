import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { audit, body, requireAny } from '@/lib/admin-route'
import { getNoticesAdmin } from '@/lib/content'
import { noticeInput } from '@/lib/notice-input'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** GET /api/admin/notices */
export async function GET() {
  try {
    await requireAny('content.edit')
    return ok({ notices: await getNoticesAdmin() })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/admin/notices
 *
 * Notices used to be edited by pasting a snippet into content/notices.ts and
 * redeploying. They are now live on save — still in the static HTML (and so
 * still indexed), because the pages are regenerated rather than fetched.
 */
export async function POST(req: Request) {
  try {
    const user = await requireAny('content.edit')
    const data = await noticeInput(await body(req))
    const row = await db.notice.create({ data })
    await audit(user, 'notice.create', data.title)
    revalidateContent()
    return ok({ id: row.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}
