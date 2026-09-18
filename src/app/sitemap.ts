import type { MetadataRoute } from 'next'

import { getGallery, getNotices, getSlides } from '@/lib/content'
import { pickVariant } from '@/lib/media-shared'
import { absoluteUrl, indexableRoutes } from '@/lib/seo'

/**
 * sitemap.xml, built from the database: fixed routes, every published CMS
 * page and every faculty with programmes. Results, admin and student routes
 * are absent by construction — indexableRoutes() never includes them.
 *
 * lastmod is the page's real last-edit time where one exists. A lastmod of
 * "now" on every build tells search engines everything changed on every
 * deploy, and they learn to ignore the field.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [routes, notices, slides, gallery] = await Promise.all([
    indexableRoutes(),
    getNotices(),
    getSlides(),
    getGallery(),
  ])
  const lastNotice = notices[0]?.date

  return routes.map(({ path, updatedAt }) => {
    const isHome = path === '/'
    const images = isHome
      ? slides.map((s) => pickVariant(s.variants, 1600)?.path).filter(Boolean)
      : path === '/photo-tour/'
        ? gallery.flatMap((c) => c.photos.map((p) => pickVariant(p.variants, 1200)?.path)).filter(Boolean)
        : []

    const lastModified =
      path === '/notices/' && lastNotice ? new Date(lastNotice) : updatedAt ? new Date(updatedAt) : undefined

    return {
      url: absoluteUrl(path),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: isHome || path === '/notices/' ? 'weekly' : 'monthly',
      priority: isHome ? 1 : path.split('/').filter(Boolean).length === 1 ? 0.8 : 0.6,
      ...(images.length ? { images: images.map((i) => absoluteUrl(i as string)) } : {}),
    }
  })
}
