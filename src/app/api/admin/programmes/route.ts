import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, s } from '@/lib/admin-route'
import { programmeInput } from '@/lib/programme-input'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** POST /api/admin/programmes — { facultyId, name, award, durationMonths, mode, eligibility, intake?, published? } */
export async function POST(req: Request) {
  try {
    const user = await requireAny('programmes.edit')
    const input = await body(req)
    const facultyId = s(input.facultyId, 40)
    const faculty = await db.faculty.findUnique({ where: { id: facultyId } })
    if (!faculty) return fail('Choose a faculty.')

    const data = programmeInput(input)
    if (await db.programme.findUnique({ where: { facultyId_slug: { facultyId, slug: data.slug } } })) {
      return fail('This faculty already has a programme with that name.', 409)
    }
    const last = await db.programme.findFirst({
      where: { facultyId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    const row = await db.programme.create({
      data: { ...data, facultyId, sortOrder: (last?.sortOrder ?? -1) + 1 },
    })
    await audit(user, 'programme.create', `${data.name} (${faculty.name})`)
    revalidateContent()
    return ok({ id: row.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}
