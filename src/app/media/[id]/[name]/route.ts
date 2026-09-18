import { readMediaFile } from '@/lib/media'

export const dynamic = 'force-dynamic'

/**
 * GET /media/<id>/<file> — public media uploaded through the admin panel.
 *
 * Immutable caching is safe because a media id is never reused: replacing a
 * logo uploads a new item at a new URL. nosniff stops a browser second-
 * guessing the content type, and PDFs open inline rather than downloading.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params
  const file = await readMediaFile(id, name)
  if (!file) return new Response('Not found', { status: 404 })

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(file.bytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ...(file.contentType === 'application/pdf' ? { 'Content-Disposition': 'inline' } : {}),
    },
  })
}
