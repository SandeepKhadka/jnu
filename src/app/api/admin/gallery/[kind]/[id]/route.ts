import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, s } from '@/lib/admin-route'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ kind: string; id: string }> }

/**
 * PUT /api/admin/gallery/category/[id] — { title, blurb }
 * PUT /api/admin/gallery/photo/[id]    — { alt, caption, categoryId, published }
 */
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await requireAny('content.edit')
    const { kind, id } = await ctx.params
    const input = await body(req)

    if (kind === 'category') {
      const title = s(input.title, 80)
      if (!title) return fail('A section title is required.')
      // Checked first so a section deleted by someone else mid-edit reports a
      // 404 rather than surfacing a Prisma error as a 500.
      if (!(await db.galleryCategory.findUnique({ where: { id }, select: { id: true } }))) {
        return fail('Not found.', 404)
      }
      // The slug is left alone on purpose: it is the section's public address.
      const row = await db.galleryCategory.update({ where: { id }, data: { title, blurb: s(input.blurb, 300) } })
      await audit(user, 'gallery.category.update', row.title)
    } else if (kind === 'photo') {
      const alt = s(input.alt, 300)
      if (!alt) return fail('Describe the photograph (alt text).')
      const categoryId = s(input.categoryId, 40)
      if (categoryId && !(await db.galleryCategory.findUnique({ where: { id: categoryId }, select: { id: true } }))) {
        return fail('Choose a section.')
      }
      if (!(await db.galleryPhoto.findUnique({ where: { id }, select: { id: true } }))) {
        return fail('Not found.', 404)
      }
      await db.galleryPhoto.update({
        where: { id },
        data: {
          alt,
          caption: s(input.caption, 200) || alt,
          published: input.published !== false,
          ...(categoryId ? { categoryId } : {}),
        },
      })
      await audit(user, 'gallery.photo.update', alt)
    } else {
      return fail('Unknown item.', 404)
    }

    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE — a section must be empty first; a photo's image stays in the library. */
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireAny('content.edit')
    const { kind, id } = await ctx.params

    if (kind === 'category') {
      const cat = await db.galleryCategory.findUnique({
        where: { id },
        include: { _count: { select: { photos: true } } },
      })
      if (!cat) return fail('Not found.', 404)
      if (cat._count.photos > 0) {
        return fail(`"${cat.title}" still has ${cat._count.photos} photo(s). Move or delete them first.`, 409)
      }
      await db.galleryCategory.delete({ where: { id } })
      await audit(user, 'gallery.category.delete', cat.title)
    } else if (kind === 'photo') {
      const p = await db.galleryPhoto.findUnique({ where: { id } })
      if (!p) return fail('Not found.', 404)
      await db.galleryPhoto.delete({ where: { id } })
      await audit(user, 'gallery.photo.delete', p.alt)
    } else {
      return fail('Unknown item.', 404)
    }

    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
