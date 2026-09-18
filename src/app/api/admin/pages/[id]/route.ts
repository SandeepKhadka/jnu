import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, s } from '@/lib/admin-route'
import { getPageAdmin } from '@/lib/content'
import { normaliseBlocks, normaliseCrumbs, normalisePath } from '@/lib/content-types'
import { revalidateContent } from '@/lib/revalidate'
import { reservedPath } from '@/lib/page-paths'

export const dynamic = 'force-dynamic'

/**
 * Pages other code depends on. They can be edited, but not moved or deleted:
 * the routes that render them look them up by exactly this path.
 */
const SYSTEM_PATHS = new Set(['/admission/process/', '/photo-tour/', '/programmes/', '/privacy/'])

/** GET /api/admin/pages/[id] */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAny('content.edit')
    const { id } = await ctx.params
    const page = await getPageAdmin(id)
    if (!page) return fail('Not found.', 404)
    return ok({ page, system: SYSTEM_PATHS.has(page.path) })
  } catch (e) {
    return handleError(e)
  }
}

/** PUT /api/admin/pages/[id] */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('content.edit')
    const { id } = await ctx.params
    const existing = await db.page.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const input = await body(req)
    let path = existing.path
    if (input.path !== undefined && !SYSTEM_PATHS.has(existing.path)) {
      const next = normalisePath(input.path)
      if (!next) return fail('Enter a URL path of lowercase words and hyphens, e.g. /about/hostels/.')
      if (next !== existing.path) {
        if (reservedPath(next)) return fail('That URL is used by another part of the site.')
        if (await db.page.findUnique({ where: { path: next } })) return fail('A page already exists at that URL.', 409)
      }
      path = next
    }

    const title = s(input.title, 120)
    const description = s(input.description, 300)
    if (!title) return fail('A title is required.')
    if (!description) return fail('A description is required — it is what search engines show.')

    await db.page.update({
      where: { id },
      data: {
        path,
        title,
        description,
        intro: s(input.intro, 400) || null,
        body: JSON.stringify(normaliseBlocks(input.body)),
        crumbs: JSON.stringify(normaliseCrumbs(input.crumbs)),
        // System pages stay published: the routes that render them expect them.
        published: SYSTEM_PATHS.has(existing.path) ? true : input.published !== false,
      },
    })

    await audit(
      user,
      'page.update',
      path === existing.path ? path : `${existing.path} → ${path} (old URL now 404s — add a redirect)`
    )
    revalidateContent()
    return ok({ ok: true, path })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/admin/pages/[id] */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('content.edit')
    const { id } = await ctx.params
    const existing = await db.page.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)
    if (SYSTEM_PATHS.has(existing.path)) {
      return fail('This page is part of the site structure and cannot be deleted. Edit its text instead.', 409)
    }
    await db.page.delete({ where: { id } })
    await audit(user, 'page.delete', existing.path)
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
