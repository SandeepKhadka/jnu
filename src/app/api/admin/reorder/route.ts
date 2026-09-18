import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny } from '@/lib/admin-route'
import { revalidateContent } from '@/lib/revalidate'
import type { Permission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

const ENTITIES: Record<string, Permission> = {
  faculty: 'programmes.edit',
  programme: 'programmes.edit',
  slide: 'content.edit',
  galleryCategory: 'content.edit',
  galleryPhoto: 'content.edit',
}

/**
 * POST /api/admin/reorder — { entity, ids: string[] }
 *
 * Writes sortOrder = position for each id, in one transaction. Only ids that
 * exist are touched; a stale list from another tab cannot create anything.
 */
export async function POST(req: Request) {
  try {
    const input = await body(req)
    const entity = String(input.entity ?? '')
    const permission = ENTITIES[entity]
    if (!permission) return fail('Unknown list.')
    const user = await requireAny(permission)

    const ids = Array.isArray(input.ids)
      ? input.ids.filter((x): x is string => typeof x === 'string').slice(0, 500)
      : []
    if (!ids.length) return fail('Nothing to reorder.')

    await db.$transaction(
      ids.map((id, i) => {
        const data = { sortOrder: i }
        switch (entity) {
          case 'faculty':
            return db.faculty.updateMany({ where: { id }, data })
          case 'programme':
            return db.programme.updateMany({ where: { id }, data })
          case 'slide':
            return db.slide.updateMany({ where: { id }, data })
          case 'galleryCategory':
            return db.galleryCategory.updateMany({ where: { id }, data })
          default:
            return db.galleryPhoto.updateMany({ where: { id }, data })
        }
      })
    )

    await audit(user, `reorder.${entity}`, `${ids.length} items`)
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
