/**
 * Media types and srcset helpers — client-safe.
 *
 * A Media row stores its encoded variants as [{ w, format, path }]. These
 * helpers turn that list into <picture> sources, so every component renders
 * an uploaded image the same way: AVIF, then WebP, then JPEG/PNG, each with
 * a width-described srcset the browser chooses from.
 */

export type MediaFormat = 'avif' | 'webp' | 'jpg' | 'png'

export type MediaVariant = { w: number; format: MediaFormat; path: string }

export type MediaItem = {
  id: string
  kind: 'IMAGE' | 'DOCUMENT'
  filename: string
  contentType: string
  bytes: number
  width: number | null
  height: number | null
  alt: string
  variants: MediaVariant[]
  /** Documents: the public URL. Images: the largest fallback variant. */
  url: string
  createdAt: string
}

export function parseVariants(raw: string | null | undefined): MediaVariant[] {
  try {
    const v = JSON.parse(raw ?? '[]')
    return Array.isArray(v)
      ? v.filter(
          (x) =>
            x &&
            typeof x.w === 'number' &&
            typeof x.path === 'string' &&
            ['avif', 'webp', 'jpg', 'png'].includes(x.format)
        )
      : []
  } catch {
    return []
  }
}

export function srcSetFor(variants: MediaVariant[], format: MediaFormat): string {
  return variants
    .filter((v) => v.format === format)
    .sort((a, b) => a.w - b.w)
    .map((v) => `${v.path} ${v.w}w`)
    .join(', ')
}

/** The universally supported fallback: JPEG, or PNG for images with transparency. */
export function fallbackFormat(variants: MediaVariant[]): MediaFormat {
  return variants.some((v) => v.format === 'jpg') ? 'jpg' : 'png'
}

/** Variant closest to (at least) `target` pixels wide in the fallback format. */
export function pickVariant(variants: MediaVariant[], target: number): MediaVariant | null {
  const f = fallbackFormat(variants)
  const list = variants.filter((v) => v.format === f).sort((a, b) => a.w - b.w)
  return list.find((v) => v.w >= target) ?? list[list.length - 1] ?? null
}

export function largestVariant(variants: MediaVariant[]): MediaVariant | null {
  return pickVariant(variants, Number.MAX_SAFE_INTEGER)
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
