import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny, s } from '@/lib/admin-route'
import { programmeInput } from '@/lib/programme-input'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** PUT /api/admin/programmes/[id] — same fields as create; facultyId moves it. */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('programmes.edit')
    const { id } = await ctx.params
    const existing = await db.programme.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)

    const input = await body(req)
    const data = programmeInput(input)
    const facultyId = s(input.facultyId, 40) || existing.facultyId
    if (!(await db.faculty.findUnique({ where: { id: facultyId }, select: { id: true } }))) {
      return fail('Choose a faculty.')
    }
    const clash = await db.programme.findUnique({ where: { facultyId_slug: { facultyId, slug: data.slug } } })
    if (clash && clash.id !== id) return fail('That faculty already has a programme with that name.', 409)

    await db.programme.update({ where: { id }, data: { ...data, facultyId } })

    // Results and applications store the programme NAME as text. Renaming
    // does not rewrite them — what a student applied for, or was examined
    // in, is history — but the audit line records the rename so the two can
    // be matched up later.
    await audit(
      user,
      'programme.update',
      existing.name === data.name ? data.name : `Renamed "${existing.name}" → "${data.name}"`
    )
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

/** DELETE /api/admin/programmes/[id] */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAny('programmes.edit')
    const { id } = await ctx.params
    const existing = await db.programme.findUnique({ where: { id } })
    if (!existing) return fail('Not found.', 404)
    await db.programme.delete({ where: { id } })
    await audit(user, 'programme.delete', existing.name)
    revalidateContent()
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
