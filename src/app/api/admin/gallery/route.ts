import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, s } from '@/lib/admin-route'
import { getGalleryAdmin } from '@/lib/content'
import { slugify } from '@/lib/content-types'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** GET /api/admin/gallery — categories with every photo. */
export async function GET() {
  try {
    await requireAny('content.edit')
    return ok({ categories: await getGalleryAdmin() })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/admin/gallery
 *   { type: 'category', title, blurb }
 *   { type: 'photo', categoryId, mediaId, alt, caption }
 */
export async function POST(req: Request) {
  try {
    const user = await requireAny('content.edit')
    const input = await body(req)

    if (input.type === 'category') {
      const title = s(input.title, 80)
      if (!title) return fail('A section title is required.')
      let slug = slugify(title) || 'section'
      for (let i = 2; await db.galleryCategory.findUnique({ where: { slug } }); i++) slug = `${slugify(title)}-${i}`
      const last = await db.galleryCategory.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
      const row = await db.galleryCategory.create({
        data: { title, slug, blurb: s(input.blurb, 300), sortOrder: (last?.sortOrder ?? -1) + 1 },
      })
      await audit(user, 'gallery.category.create', title)
      revalidateContent()
      return ok({ id: row.id }, 201)
    }

    if (input.type === 'photo') {
      const categoryId = s(input.categoryId, 40)
      const mediaId = s(input.mediaId, 40)
      if (!(await db.galleryCategory.findUnique({ where: { id: categoryId }, select: { id: true } }))) {
        return fail('Choose a section.')
      }
      const media = await db.media.findUnique({ where: { id: mediaId } })
      if (!media || media.kind !== 'IMAGE') return fail('Choose an image.')
      const alt = s(input.alt, 300) || media.alt
      if (!alt) return fail('Describe the photograph (alt text) — it is what image search indexes.')
      const last = await db.galleryPhoto.findFirst({
        where: { categoryId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })
      const row = await db.galleryPhoto.create({
        data: {
          categoryId,
          mediaId,
          alt,
          caption: s(input.caption, 200) || alt,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
      })
      await audit(user, 'gallery.photo.create', alt)
      revalidateContent()
      return ok({ id: row.id }, 201)
    }

    return fail('Unknown item.')
  } catch (e) {
    return handleError(e)
  }
}
