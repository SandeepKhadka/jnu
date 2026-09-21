import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { db } from '@/lib/db'

/**
 * File storage for uploaded documents.
 *
 * NOTHING HERE WRITES TO public/.
 * ------------------------------
 * An Aadhaar scan or a student's passport photograph placed under public/ is
 * published the instant it is written, at a URL anyone can guess or a crawler
 * can stumble into, with no way to take it back once indexed. Bytes go to a
 * directory outside the served tree under a random key, and reach a browser
 * only through /api/uploads/[id], which checks a session first.
 *
 * PRODUCTION
 * ----------
 * The local-disk backend below is correct for development and for a host with
 * a persistent volume (Render, a VPS). It is NOT correct on Vercel, whose
 * filesystem is ephemeral — uploads would survive until the next deploy and
 * then vanish, exactly as DEPLOY.md already warns about SQLite. Before
 * launching on Vercel, implement `put`/`get`/`remove` against S3, Cloudflare
 * R2 or Vercel Blob. That is the only part of this file that changes; callers
 * go through the exported functions and never touch the disk directly.
 */

/**
 * `||`, not `??`.
 *
 * `UPLOAD_DIR=` with nothing after it is the normal result of copying
 * .env.local.example, and it is a *set* variable as far as `??` is concerned.
 * That made UPLOAD_ROOT the empty string, which path.join resolves relative
 * to the working directory — so Aadhaar scans were written into the project
 * root, where .gitignore (which covers /var/ only) would not have stopped
 * them being committed. An empty value means "not configured".
 */
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), 'var', 'uploads')

/** What each kind of upload is allowed to be, and how big. */
export const UPLOAD_RULES = {
  PHOTO: {
    types: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 2 * 1024 * 1024,
    label: 'photograph',
  },
  AADHAAR: {
    types: ['image/jpeg', 'image/png', 'application/pdf'],
    maxBytes: 5 * 1024 * 1024,
    label: 'Aadhaar document',
  },
  QUALIFICATION: {
    types: ['image/jpeg', 'image/png', 'application/pdf'],
    maxBytes: 5 * 1024 * 1024,
    label: 'qualification document',
  },
} as const

export type UploadKind = keyof typeof UPLOAD_RULES

/**
 * Magic-number check.
 *
 * The browser-supplied Content-Type is attacker-controlled and means nothing.
 * Reading the first bytes is what actually establishes that a file claiming to
 * be a JPEG is a JPEG, and stops an HTML or SVG payload being stored and later
 * served back to a signed-in member of staff.
 */
function sniff(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP')
    return 'image/webp'
  if (buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf'
  return null
}

export type StoreResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

/** Validates and stores one uploaded file, returning its Upload row id. */
export async function storeUpload(file: File, kind: UploadKind): Promise<StoreResult> {
  const rule = UPLOAD_RULES[kind]

  if (file.size === 0) return { ok: false, error: `The ${rule.label} appears to be empty.` }
  if (file.size > rule.maxBytes) {
    return {
      ok: false,
      error: `The ${rule.label} must be ${Math.round(rule.maxBytes / 1024 / 1024)} MB or smaller.`,
    }
  }

  const buf = Buffer.from(await file.arrayBuffer())

  // Trust the bytes, not the declared type.
  const actual = sniff(buf)
  if (!actual || !(rule.types as readonly string[]).includes(actual)) {
    return {
      ok: false,
      error: `The ${rule.label} must be a ${rule.types
        .map((t) => t.split('/')[1].toUpperCase())
        .join(', ')} file.`,
    }
  }

  // Random key, so nothing about the student or the document is inferable from
  // the stored filename, and two uploads can never collide.
  const key = `${kind.toLowerCase()}/${randomBytes(16).toString('hex')}`
  const target = path.join(UPLOAD_ROOT, key)

  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, buf)

  const row = await db.upload.create({
    data: {
      storageKey: key,
      // The original name is metadata only and is never used to build a path.
      filename: path.basename(file.name).slice(0, 120) || 'upload',
      contentType: actual,
      bytes: buf.length,
      kind,
    },
  })

  return { ok: true, id: row.id }
}

export type StoredFile = { bytes: Buffer; contentType: string; filename: string }

/** Reads a stored file back. Callers must have authorised the request first. */
export async function readUpload(id: string): Promise<StoredFile | null> {
  const row = await db.upload.findUnique({ where: { id } })
  if (!row) return null

  // storageKey is generated by this module, never by a caller, but resolving
  // it and confirming it is still inside UPLOAD_ROOT costs nothing and closes
  // off path traversal for good if that ever stops being true.
  const target = path.resolve(UPLOAD_ROOT, row.storageKey)
  if (!target.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) return null

  try {
    const bytes = await readFile(target)
    return { bytes, contentType: row.contentType, filename: row.filename }
  } catch {
    return null
  }
}

/** Deletes a stored file and its row. */
export async function removeUpload(id: string): Promise<void> {
  const row = await db.upload.findUnique({ where: { id } })
  if (!row) return

  const target = path.resolve(UPLOAD_ROOT, row.storageKey)
  if (target.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) {
    await unlink(target).catch(() => {})
  }
  await db.upload.delete({ where: { id } }).catch(() => {})
}

/** Stable etag for cache validation on authenticated file responses. */
export function etagFor(id: string, bytes: number): string {
  return `"${createHash('sha1').update(`${id}:${bytes}`).digest('hex')}"`
}
