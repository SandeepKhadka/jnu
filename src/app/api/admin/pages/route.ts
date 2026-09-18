import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, s } from '@/lib/admin-route'
import { listPagesAdmin } from '@/lib/content'
import { normaliseBlocks, normaliseCrumbs, normalisePath } from '@/lib/content-types'
import { revalidateContent } from '@/lib/revalidate'
import { reservedPath } from '@/lib/page-paths'

export const dynamic = 'force-dynamic'

/** GET /api/admin/pages */
export async function GET() {
  try {
    await requireAny('content.edit')
    return ok({ pages: await listPagesAdmin() })
  } catch (e) {
    return handleError(e)
  }
}

/** POST /api/admin/pages — { path, title, description, intro?, body?, crumbs?, published? } */
export async function POST(req: Request) {
  try {
    const user = await requireAny('content.edit')
    const input = await body(req)

    const path = normalisePath(input.path)
    if (!path) return fail('Enter a URL path of lowercase words and hyphens, e.g. /about/hostels/.')
    if (reservedPath(path)) return fail('That URL is used by another part of the site. Choose another.')
    if (await db.page.findUnique({ where: { path } })) return fail('A page already exists at that URL.', 409)

    const title = s(input.title, 120)
    const description = s(input.description, 300)
    if (!title) return fail('A title is required.')
    if (!description) return fail('A description is required — it is what search engines show.')

    const row = await db.page.create({
      data: {
        path,
        title,
        description,
        intro: s(input.intro, 400) || null,
        body: JSON.stringify(normaliseBlocks(input.body)),
        crumbs: JSON.stringify(normaliseCrumbs(input.crumbs)),
        published: input.published !== false,
      },
    })
    await audit(user, 'page.create', path)
    revalidateContent()
    return ok({ id: row.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}
