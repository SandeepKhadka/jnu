import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, b, body, colour, requireAny, s } from '@/lib/admin-route'
import { getSlidesAdmin } from '@/lib/content'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** GET /api/admin/slides */
export async function GET() {
  try {
    await requireAny('content.edit')
    return ok({ slides: await getSlidesAdmin() })
  } catch (e) {
    return handleError(e)
  }
}

/** POST /api/admin/slides — { mediaId, alt, banner?, bannerBackground?, enabled? } */
export async function POST(req: Request) {
  try {
    const user = await requireAny('content.edit')
    const input = await body(req)
    const mediaId = s(input.mediaId, 40)
    const media = await db.media.findUnique({ where: { id: mediaId } })
    if (!media || media.kind !== 'IMAGE') return fail('Choose an image for the slide.')

    const alt = s(input.alt, 300) || media.alt
    if (!alt) return fail('Describe the image (alt text) — screen readers and search engines rely on it.')

    const last = await db.slide.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
    const row = await db.slide.create({
      data: {
        mediaId,
        alt,
        banner: b(input.banner),
        bannerBackground: colour(input.bannerBackground),
        enabled: input.enabled !== false,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    })
    await audit(user, 'slide.create', alt)
    revalidateContent()
    return ok({ id: row.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}
