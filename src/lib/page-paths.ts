/**
 * Paths a CMS page may not take: they belong to routes with their own code,
 * and a page there would either never show or shadow a real feature.
 */
export const RESERVED_PREFIXES = [
  '/admin/',
  '/api/',
  '/media/',
  '/results/',
  '/student/',
  '/verify/',
  '/notices/',
  '/contact/',
]

export function reservedPath(path: string): boolean {
  return path === '/' || RESERVED_PREFIXES.some((p) => path === p || path.startsWith(p)) ||
    /^\/programmes\/[^/]+\/$/.test(path)
}
