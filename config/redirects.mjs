/**
 * Permanent redirects from the previous site's URLs, and the security headers.
 *
 * This file is the single source of truth, imported directly by
 * next.config.mjs. It is plain ESM rather than TypeScript because
 * next.config.mjs cannot import TS.
 *
 * WHY THIS EXISTS AT ALL
 * ----------------------
 * These rules used to live only in public/_headers and public/_redirects,
 * which are Netlify / Cloudflare Pages syntax. This app has API routes and a
 * database, so it runs on a Node host (see DEPLOY.md), where everything under
 * public/ is served verbatim: `_redirects` was being handed out as a text file
 * at /_redirects and not one rule ever fired, and none of the security headers
 * were ever sent. Every inbound link and every ranking from the old site was
 * landing on a 404.
 *
 * Targets point at their FINAL destination, never at another redirect. The
 * faculty pages moved to /programmes/ when the catalogue widened to sixteen
 * faculties, and these were repointed at the same time rather than left to
 * chain through /faculty/ — each extra hop costs a round trip and a little
 * signal.
 */

/** @type {[string, string][]} */
const map = [
  ['/index.html', '/'],
  ['/admission-2/index.html', '/admission/process/'],
  ['/fee-structure-2/index.html', '/admission/fee-structure/'],
  ['/notice-and-circular/index.html', '/notices/'],
  ['/jnuresults/index.html', '/results/'],
  ['/jnuresults/result.html', '/results/'],
  ['/enrollment-status/index.html', '/student-zone/enrollment-status/'],
  ['/placement-notice/index.html', '/student-zone/placement-notices/'],
  ['/time-table/index.html', '/student-zone/time-table/'],
  ['/download-forms/index.html', '/admission/download-forms/'],
  ['/syllabus-2/index.html', '/admission/syllabus/'],

  // Faculties — old WordPress paths straight to the new /programmes/ URLs.
  ['/engineering-and-technology/index.html', '/programmes/engineering-technology/'],
  ['/management/index.html', '/programmes/commerce-management/'],
  ['/Pharmaceutical-Sciences/index.html', '/programmes/pharmacy/'],
  ['/computer-application/index.html', '/programmes/computer-application/'],
  ['/applied-sciences/index.html', '/programmes/science/'],
  ['/law/index.html', '/programmes/law/'],
  ['/education/index.html', '/programmes/education/'],
  ['/arts-and-commerce/index.html', '/programmes/arts-social-science/'],

  // About
  ['/foundation/index.html', '/about/foundation/'],
  ['/jodhpur-national-university-chairperson-message/index.html', '/about/chairperson-message/'],
  ['/infrastructure/index.html', '/about/infrastructure/'],
  ['/academic-council/index.html', '/about/academic-council/'],
  ['/affiliations/index.html', '/about/accreditation/'],
  ['/achievers/index.html', '/about/achievers/'],
  ['/community-Program/index.html', '/about/community-programme/'],

  // Other
  ['/photo-gallery/index.html', '/photo-tour/'],
  ['/contact-us/index.html', '/contact/'],
  ['/newsletter/index.html', '/notices/'],
  ['/publication/index.html', '/research/'],
  ['/convocation/index.html', '/notices/'],
  ['/calendar/index.html', '/notices/'],
  ['/blog/index.html', '/notices/'],
  ['/jodhpur-national-university-distance-education-program/index.html', '/admission/'],

  // Dead WordPress endpoints from the old install — send crawlers home rather
  // than to a 404, and stop the login probes reaching anything.
  ['/wp-login.php', '/'],
  ['/xmlrpc.php', '/'],
  ['/feed/index.html', '/notices/'],

  // Internal move: /faculty/* predates the sixteen-faculty catalogue.
  ['/faculty', '/programmes/'],
  ['/faculty/engineering-technology', '/programmes/engineering-technology/'],
  ['/faculty/management', '/programmes/commerce-management/'],
  ['/faculty/pharmaceutical-sciences', '/programmes/pharmacy/'],
  ['/faculty/computer-application', '/programmes/computer-application/'],
  ['/faculty/applied-sciences-nursing', '/programmes/science/'],
  ['/faculty/law', '/programmes/law/'],
  ['/faculty/education', '/programmes/education/'],
  ['/faculty/arts-commerce', '/programmes/arts-social-science/'],
]

/**
 * `trailingSlash: true` makes Next 308 `/faculty/law` to `/faculty/law/`
 * BEFORE consulting this table, so a source without the slash would never
 * match. Paths ending in a real filename (`.html`, `.php`) are left alone,
 * because Next does not append a slash to those.
 */
function normaliseSource(source) {
  const last = source.split('/').pop() ?? ''
  if (last.includes('.')) return source
  return source.endsWith('/') ? source : `${source}/`
}

export const redirects = map.map(([source, destination]) => ({
  source: normaliseSource(source),
  destination,
  permanent: true,
}))

/**
 * Security headers, ported from public/_headers for the same reason as above.
 * Caching for hashed build assets is handled by Next itself.
 */
export const securityHeaders = [
  {
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
    ],
  },
  {
    source: '/images/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
  },
  {
    source: '/documents/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
  },
  {
    // Uploaded documents are personal data. They are already behind an auth
    // check; this stops a shared cache holding a copy as well.
    source: '/api/uploads/:path*',
    headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
  },
]
