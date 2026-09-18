/**
 * The canonical origin. Deliberately NOT editable in the admin panel: it is a
 * deployment fact (DNS, TLS, redirects), and a typo here would re-point every
 * canonical URL, the sitemap and every QR code ever printed. Set
 * NEXT_PUBLIC_SITE_URL in the environment instead.
 *
 * Client-safe: NEXT_PUBLIC_ variables are inlined at build time.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jodhpurnationaluniversity.co.in').replace(
  /\/$/,
  ''
)

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')
