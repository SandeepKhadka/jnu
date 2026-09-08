import type { MetadataRoute } from 'next'
import { absoluteUrl, indexableRoutes } from '@/lib/seo'
import { sortedNotices } from '@/content/notices'

// Required by `output: 'export'` — emits a real /sitemap.xml file at build time.
export const dynamic = 'force-static'

/**
 * Generated at build time into /out/sitemap.xml.
 * The original site had NO sitemap at all — both sitemap.xml and
 * sitemap_index.xml returned 404.
 *
 * Results and admin routes are absent by construction: indexableRoutes()
 * never includes them, so student data cannot leak into the index via here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastNotice = sortedNotices[0]?.date

  return indexableRoutes().map((route) => {
    const isHome = route === '/'
    const isNoticeIndex = route === '/notices/'

    return {
      url: absoluteUrl(route),
      lastModified: isNoticeIndex && lastNotice ? new Date(lastNotice) : new Date(),
      changeFrequency: isHome || isNoticeIndex ? 'weekly' : 'monthly',
      priority: isHome ? 1 : route.split('/').filter(Boolean).length === 1 ? 0.8 : 0.6,
    }
  })
}
