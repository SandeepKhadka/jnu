import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, b, body, colour, requireAny, s } from '@/lib/admin-route'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** PUT /api/admin/slides/[id] — { mediaId?, alt, banner, bannerBackground, enabled } */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('content.edit')
    const { id } = await ctx.params
    const existing = await db.slide.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const input = await body(req)
    const mediaId = s(input.mediaId, 40) || existing.mediaId
    const media = await db.media.findUnique({ where: { id: mediaId } })
    if (!media || media.kind !== 'IMAGE') return fail('Choose an image for the slide.')
    const alt = s(input.alt, 300)
    if (!alt) return fail('Describe the image (alt text).')

    await db.slide.update({
      where: { id },
      data: {
        mediaId,
        alt,
        banner: b(input.banner),
        bannerBackground: colour(input.bannerBackground),
        enabled: input.enabled !== false,
      },
    })
    await audit(user, 'slide.update', alt)
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/admin/slides/[id] — the image stays in the media library. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('content.edit')
    const { id } = await ctx.params
    const existing = await db.slide.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)
    await db.slide.delete({ where: { id } })
    await audit(user, 'slide.delete', existing.alt)
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
