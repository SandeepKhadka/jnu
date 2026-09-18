import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, s } from '@/lib/admin-route'
import { readSetting } from '@/lib/content'
import { deleteMedia, toMediaItem } from '@/lib/media'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

const MEDIA_USERS = ['content.edit', 'branding.edit', 'exams.settings'] as const

/** PATCH /api/admin/media/[id] — { alt } */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny(...MEDIA_USERS)
    const { id } = await ctx.params
    const input = await body(req)
    const exists = await db.media.findUnique({ where: { id }, select: { id: true } })
    if (!exists) return fail('Not found.', 404)
    const row = await db.media.update({ where: { id }, data: { alt: s(input.alt, 300) } })
    await audit(user, 'media.update', row.filename)
    revalidateContent()
    return ok({ media: toMediaItem(row) })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * DELETE /api/admin/media/[id]
 *
 * Refused while anything still uses the file — deleting a logo, slide or
 * notice attachment out from under the live site would leave broken images
 * and dead links. The response names what uses it.
 */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny(...MEDIA_USERS)
    const { id } = await ctx.params
    const row = await db.media.findUnique({
      where: { id },
      include: { _count: { select: { slides: true, galleryPhotos: true, notices: true } } },
    })
    if (!row) return fail('Not found.', 404)

    const uses: string[] = []
    if (row._count.slides) uses.push(`${row._count.slides} carousel slide(s)`)
    if (row._count.galleryPhotos) uses.push(`${row._count.galleryPhotos} gallery photo(s)`)
    if (row._count.notices) uses.push(`${row._count.notices} notice(s)`)
    const [branding, exams] = await Promise.all([readSetting('branding'), readSetting('examinations')])
    if (branding.logoId === id) uses.push('the site logo')
    if (branding.crestId === id) uses.push('the crest / favicon')
    if (branding.ogImageId === id) uses.push('the share image')
    if (exams.signatureId === id) uses.push("the Controller's signature")

    if (uses.length) return fail(`In use by ${uses.join(', ')}. Remove it there first.`, 409)

    await deleteMedia(id)
    await audit(user, 'media.delete', row.filename)
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
