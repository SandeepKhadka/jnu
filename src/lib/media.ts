import 'server-only'

import { randomBytes } from 'node:crypto'
import { deletePrefix, getObject, putObject } from '@/lib/object-store'
import path from 'node:path'
import sharp, { type Sharp } from 'sharp'

import { db } from '@/lib/db'
import {
  largestVariant,
  parseVariants,
  type MediaItem,
  type MediaVariant,
} from '@/lib/media-shared'

/**
 * Public media: images and documents an administrator uploads for the site.
 *
 * Deliberately separate from lib/storage.ts, which holds PRIVATE documents
 * (Aadhaar scans) behind an auth check. Everything here is served to anyone
 * at /media/<id>/<file> with year-long immutable caching — file names are
 * never reused, so a replaced logo is a new id and a new URL.
 *
 * Bytes go through lib/object-store, never to public/: Next serves only the
 * public/ files that existed at build time, so anything written there at
 * runtime would 404 in production. On a serverless host the object store is
 * a private Vercel Blob store, so these files are fetched by the route rather
 * than linked directly — one hop slower than a CDN, and the reason the
 * seeded imagery still lives in public/ where it is served statically.
 */

const IMAGE_WIDTHS = [320, 640, 1024, 1600, 2400]
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

/**
 * 50 MB, which covers essentially every real scanned document the office
 * produces. It is not higher for three reasons: the whole upload is buffered
 * in memory before anything else happens, Cloudflare's free tier refuses
 * bodies over 100 MB anyway, and a file this large is nearly always a scan
 * saved at camera resolution — better compressed than accommodated.
 *
 * Images have no equivalent problem: sharp re-encodes them to AVIF/WebP/JPEG
 * at five widths, so a 14 MB photograph is already served as ~40 KB.
 */
const MAX_DOC_BYTES = 50 * 1024 * 1024

/** "63.4 MB" — for an error message that names the actual file. */
function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Magic numbers only. SVG is deliberately not accepted: it can carry script,
 * and served from this origin it would run with a signed-in admin's session.
 */
function sniff(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP')
    return 'image/webp'
  if (buf.length >= 6 && /^GIF8[79]a/.test(buf.subarray(0, 6).toString('ascii'))) return 'image/gif'
  if (buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf'
  return null
}

function safeStem(filename: string): string {
  const base = path.basename(filename).replace(/\.[^.]+$/, '')
  const stem = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return stem || 'file'
}

export type UploadOutcome = { ok: true; media: MediaItem } | { ok: false; error: string }

export async function storeMedia(file: File, actorEmail: string, alt = ''): Promise<UploadOutcome> {
  if (file.size === 0) return { ok: false, error: 'The file is empty.' }
  const buf = Buffer.from(await file.arrayBuffer())
  const type = sniff(buf)
  if (!type) {
    return {
      ok: false,
      error: 'Upload a JPG, PNG, WebP or GIF image, or a PDF. SVG is not accepted.',
    }
  }

  // The message says what to DO, not just what the rule is. Staff hitting this
  // are almost always holding a scan saved at camera resolution, and "PDFs must
  // be 50 MB or smaller" leaves them stuck with a file they cannot use.
  if (type === 'application/pdf' && buf.length > MAX_DOC_BYTES) {
    return {
      ok: false,
      error:
        `This PDF is ${mb(buf.length)}, over the 50 MB limit. It is most likely a scan ` +
        'saved at full camera resolution. Compress it at ilovepdf.com/compress_pdf — it ' +
        'takes about 30 seconds and the text stays sharp — or rescan at 300 DPI in ' +
        'greyscale, then upload again.',
    }
  }
  if (type !== 'application/pdf' && buf.length > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error:
        `This image is ${mb(buf.length)}, over the 15 MB limit. Resize it to about ` +
        '2400 pixels on its longest side and upload again — the website generates its ' +
        'own smaller versions from there, so nothing larger is used.',
    }
  }

  const id = randomBytes(12).toString('hex')
  const stem = safeStem(file.name)

  try {
    if (type === 'application/pdf') {
      const name = `${stem}.pdf`
      await putObject('media', `${id}/${name}`, buf, type)
      const row = await db.media.create({
        data: {
          id,
          storage: 'local',
          kind: 'DOCUMENT',
          filename: path.basename(file.name).slice(0, 160),
          contentType: type,
          bytes: buf.length,
          path: `/media/${id}/${name}`,
          alt: alt.slice(0, 300),
          createdBy: actorEmail,
        },
      })
      return { ok: true, media: toMediaItem(row) }
    }

    // .rotate() applies the camera's EXIF orientation, then all metadata —
    // including GPS coordinates from a phone photo — is dropped on encode.
    const base = sharp(buf, { failOn: 'error' }).rotate()
    const meta = await base.metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (!width || !height) return { ok: false, error: 'That image could not be read.' }

    const alpha = Boolean(meta.hasAlpha)
    const widths = IMAGE_WIDTHS.filter((w) => w < width)
    widths.push(Math.min(width, 2400))
    const unique = [...new Set(widths)]

    const variants: MediaVariant[] = []
    for (const w of unique) {
      const resized = base.clone().resize({ width: w, withoutEnlargement: true })
      const outs: [MediaVariant['format'], Sharp][] = alpha
        ? [
            ['webp', resized.clone().webp({ quality: 88, alphaQuality: 100 })],
            ['png', resized.clone().png({ compressionLevel: 9, palette: true, quality: 90 })],
          ]
        : [
            ['avif', resized.clone().avif({ quality: 50, effort: 4 })],
            ['webp', resized.clone().webp({ quality: 74 })],
            ['jpg', resized.clone().jpeg({ quality: 80, progressive: true, mozjpeg: true })],
          ]
      for (const [format, pipeline] of outs) {
        const name = `${stem}-${w}.${format}`
        // toBuffer rather than toFile: the bytes may be going to object
        // storage, which has no filesystem to write to.
        await putObject('media', `${id}/${name}`, await pipeline.toBuffer(), TYPES[format] ?? 'application/octet-stream')
        variants.push({ w, format, path: `/media/${id}/${name}` })
      }
    }

    const row = await db.media.create({
      data: {
        id,
        storage: 'local',
        kind: 'IMAGE',
        filename: path.basename(file.name).slice(0, 160),
        contentType: alpha ? 'image/png' : 'image/jpeg',
        bytes: buf.length,
        width,
        height,
        alt: alt.slice(0, 300),
        variants: JSON.stringify(variants),
        createdBy: actorEmail,
      },
    })
    return { ok: true, media: toMediaItem(row) }
  } catch (e) {
    // A half-encoded set of variants must not be left behind for an item that
    // has no database row.
    await deletePrefix('media', id)
    console.error(e)
    return { ok: false, error: 'That file could not be processed.' }
  }
}

type MediaRow = {
  id: string
  kind: string
  filename: string
  contentType: string
  bytes: number
  width: number | null
  height: number | null
  alt: string
  variants: string
  path: string | null
  createdAt: Date
}

export function toMediaItem(row: MediaRow): MediaItem {
  const variants = parseVariants(row.variants)
  return {
    id: row.id,
    kind: row.kind === 'DOCUMENT' ? 'DOCUMENT' : 'IMAGE',
    filename: row.filename,
    contentType: row.contentType,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    alt: row.alt,
    variants,
    url: row.kind === 'DOCUMENT' ? (row.path ?? '') : (largestVariant(variants)?.path ?? ''),
    createdAt: row.createdAt.toISOString(),
  }
}

/** Deletes a local media item's files and row. Static (shipped) media keeps its files. */
export async function deleteMedia(id: string): Promise<void> {
  const row = await db.media.findUnique({ where: { id } })
  if (!row) return
  if (row.storage === 'local' && /^[a-f0-9]{24}$/.test(id)) {
    await deletePrefix('media', id)
  }
  await db.media.delete({ where: { id } })
}

const TYPES: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  pdf: 'application/pdf',
}

/** Reads /media/<id>/<name> back, refusing any id or name it did not generate. */
export async function readMediaFile(
  id: string,
  name: string
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (!/^[a-f0-9]{24}$/.test(id) || !/^[a-z0-9-]+\.(avif|webp|jpg|png|gif|pdf)$/.test(name)) return null
  const bytes = await getObject('media', `${id}/${name}`)
  if (!bytes) return null
  return { bytes, contentType: TYPES[name.split('.').pop() ?? ''] ?? 'application/octet-stream' }
}
