import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { audit, requireAny } from '@/lib/admin-route'
import { storeMedia, toMediaItem } from '@/lib/media'
import { rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/** Anyone who places images or documents on the site may use the library. */
const MEDIA_USERS = ['content.edit', 'branding.edit', 'exams.settings'] as const

/** GET /api/admin/media?kind=IMAGE|DOCUMENT */
export async function GET(req: Request) {
  try {
    await requireAny(...MEDIA_USERS)
    const kind = new URL(req.url).searchParams.get('kind')
    const rows = await db.media.findMany({
      where: kind === 'IMAGE' || kind === 'DOCUMENT' ? { kind } : {},
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return ok({ media: rows.map(toMediaItem) })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/admin/media — multipart { file, alt? }
 *
 * Images are encoded into AVIF/WebP/JPEG (or WebP/PNG with transparency) at
 * several widths on upload, and EXIF — including a phone's GPS position — is
 * stripped. SVG is refused: it can carry script.
 */
export async function POST(req: Request) {
  try {
    const user = await requireAny(...MEDIA_USERS)
    const limit = await rateLimit('media-upload', user.id, 120, 60 * 60)
    if (!limit.allowed) return fail('Upload limit reached. Try again later.', 429)

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return fail('Could not read the upload.')
    }
    const file = form.get('file')
    if (!(file instanceof File)) return fail('Choose a file to upload.')
    const altRaw = form.get('alt')
    const alt = typeof altRaw === 'string' ? altRaw : ''

    const res = await storeMedia(file, user.email, alt)
    if (!res.ok) return fail(res.error)

    await audit(user, 'media.upload', `${res.media.filename} (${res.media.kind.toLowerCase()})`)
    return ok({ media: res.media }, 201)
  } catch (e) {
    return handleError(e)
  }
}
