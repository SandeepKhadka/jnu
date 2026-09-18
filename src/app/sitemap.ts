import type { MetadataRoute } from 'next'
import { absoluteUrl, indexableRoutes } from '@/lib/seo'
import { sortedNotices } from '@/content/notices'
import { enabledSlides, galleryPhotos } from '@/content/gallery'

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

    // Image entries: how Google finds photographs that are not otherwise
    // linked as documents. The homepage carries its carousel slides and the
    // Photo Tour every gallery image.
    const images =
      isHome
        ? enabledSlides.map((s) => absoluteUrl(`/images/carousel/${s.slug}-1600.jpg`))
        : route === '/photo-tour/'
          ? galleryPhotos.map((p) => absoluteUrl(`/images/gallery/${p.slug}.jpg`))
          : undefined

    return {
      url: absoluteUrl(route),
      ...(images ? { images } : {}),
      lastModified: isNoticeIndex && lastNotice ? new Date(lastNotice) : new Date(),
      changeFrequency: isHome || isNoticeIndex ? 'weekly' : 'monthly',
      priority: isHome ? 1 : route.split('/').filter(Boolean).length === 1 ? 0.8 : 0.6,
    }
  })
}
