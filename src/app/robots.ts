import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'

// Required by `output: 'export'` — emits a real /robots.txt file at build time.
export const dynamic = 'force-static'

/**
 * Belt and braces alongside the per-page noindex tags: results and admin are
 * disallowed here as well. Student marks must never reach a search index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/results/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
