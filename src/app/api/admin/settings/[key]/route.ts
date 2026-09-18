import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, body, requireAny } from '@/lib/admin-route'
import { readSetting } from '@/lib/content'
import {
  SETTING_NORMALISERS,
  isSettingKey,
  recognitionProblem,
  type Recognition,
  type SettingKey,
} from '@/lib/content-types'
import { pickVariant, parseVariants } from '@/lib/media-shared'
import type { Permission } from '@/lib/permissions'
import { revalidateContent } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

/** Who may read and write each settings document. */
const ACCESS: Record<SettingKey, { write: Permission; read: Permission[] }> = {
  site: { write: 'content.edit', read: ['content.edit'] },
  home: { write: 'content.edit', read: ['content.edit'] },
  menu: { write: 'content.edit', read: ['content.edit'] },
  footerLinks: { write: 'content.edit', read: ['content.edit'] },
  branding: { write: 'branding.edit', read: ['branding.edit'] },
  recognition: { write: 'recognition.edit', read: ['recognition.edit'] },
  examinations: { write: 'exams.settings', read: ['exams.settings'] },
  // Readable by anyone who can print a degree, since printing needs it.
  certificateLayout: { write: 'exams.settings', read: ['exams.settings', 'certificates.issue'] },
}

async function mediaUrl(id: string | null, width: number): Promise<string | null> {
  if (!id) return null
  const m = await db.media.findUnique({ where: { id } })
  return m ? (pickVariant(parseVariants(m.variants), width)?.path ?? null) : null
}

/** Preview URLs for media referenced by a setting, for the admin form only. */
async function extras(key: SettingKey, value: unknown) {
  if (key === 'examinations') {
    // The signature is served only here, to staff with exams.settings —
    // never in public page data.
    return { signatureUrl: await mediaUrl((value as { signatureId: string | null }).signatureId, 640) }
  }
  if (key === 'branding') {
    const v = value as { logoId: string | null; crestId: string | null; ogImageId: string | null }
    return {
      previews: {
        logoId: await mediaUrl(v.logoId, 640),
        crestId: await mediaUrl(v.crestId, 320),
        ogImageId: await mediaUrl(v.ogImageId, 640),
      },
    }
  }
  return {}
}

/** GET /api/admin/settings/[key] */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await ctx.params
    if (!isSettingKey(key)) return fail('Unknown setting.', 404)
    await requireAny(...ACCESS[key].read)
    const value = await readSetting(key)
    return ok({ value, ...(await extras(key, value)) })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * PUT /api/admin/settings/[key] — { value }
 *
 * The value is normalised (lib/content-types) before it is stored, so a
 * malformed or hostile request can only ever store a well-formed document.
 */
export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await ctx.params
    if (!isSettingKey(key)) return fail('Unknown setting.', 404)
    const user = await requireAny(ACCESS[key].write)

    const input = await body(req)
    const value = SETTING_NORMALISERS[key](input.value)

    if (key === 'recognition') {
      const problem = recognitionProblem(value as Recognition)
      if (problem) return fail(problem)
    }

    // Media referenced from settings must exist, or the site would render a
    // broken image everywhere the setting is used.
    if (key === 'branding' || key === 'examinations') {
      const ids = Object.values(value as Record<string, unknown>).filter(
        (v): v is string => typeof v === 'string' && /^[a-z0-9]{10,40}$/i.test(v)
      )
      for (const id of ids) {
        if (!(await db.media.findUnique({ where: { id }, select: { id: true } }))) {
          return fail('A selected image no longer exists. Choose it again.')
        }
      }
    }

    await db.setting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(value), updatedBy: user.email },
      update: { value: JSON.stringify(value), updatedBy: user.email },
    })

    // Recognition is a legal statement: log what it now says, not just that
    // it changed.
    const detail =
      key === 'recognition'
        ? `Recognition set to: ${JSON.stringify(value)}`
        : key === 'examinations'
          ? `Examination settings updated (signature ${(value as { signatureId: string | null }).signatureId ? 'set' : 'none'})`
          : `Updated ${key}`
    await audit(user, `settings.${key}`, detail)

    revalidateContent()
    return ok({ value, ...(await extras(key, value)) })
  } catch (e) {
    return handleError(e)
  }
}
