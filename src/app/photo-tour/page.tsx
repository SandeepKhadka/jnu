import type { Metadata } from 'next'

import { galleryCategories, galleryPhotos } from '@/content/gallery'
import { pageByPath, type Block } from '@/content/pages'
import { site } from '@/content/site'
import { BlockView } from '@/components/content/Blocks'
import { PhotoGallery } from '@/components/gallery/PhotoGallery'
import { PageShell } from '@/components/layout/PageShell'
import { JsonLd } from '@/components/seo/JsonLd'
import { absoluteUrl, pageMetadata } from '@/lib/seo'

/**
 * /photo-tour/ has its own route because it renders the gallery; the prose
 * still comes from content/pages.ts through the shared <BlockView>. The
 * [...slug] catch-all excludes this path.
 */

const page = pageByPath('/photo-tour/')

export const metadata: Metadata = pageMetadata({
  title: page?.title ?? 'Photo Tour',
  description: page?.description ?? `Photographs of the ${site.name} campus.`,
  path: '/photo-tour/',
  // Share this page with a campus photograph rather than the generic card.
  ogImage: '/images/gallery/campus-aerial-view-lawns.jpg',
})

/**
 * ImageGallery schema: each photograph as an ImageObject with its caption, so
 * the images can surface in image search with the right description and the
 * page is understood as a gallery rather than a thin text page.
 */
function gallerySchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `Photo Tour — ${site.name}`,
    url: absoluteUrl('/photo-tour/'),
    about: { '@id': absoluteUrl('/#organization') },
    image: galleryPhotos.map((p) => ({
      '@type': 'ImageObject',
      contentUrl: absoluteUrl(`/images/gallery/${p.slug}.jpg`),
      name: p.caption,
      caption: p.alt,
      width: 495,
      height: 400,
    })),
  }
}

export default function PhotoTourPage() {
  if (!page) return null

  // Intro paragraph first, then the galleries, then the remaining prose.
  const [intro, ...rest] = page.body as Block[]

  return (
    <>
      <JsonLd data={gallerySchema()} />
      <PageShell title={page.title} intro={page.intro} crumbs={page.crumbs}>
        {intro ? <BlockView block={intro} /> : null}

        {galleryCategories.map((c) => {
          const photos = galleryPhotos.filter((p) => p.category === c.id)
          if (photos.length === 0) return null
          return (
            <section key={c.id} aria-labelledby={`gallery-${c.id}`} className="mt-8">
              <h2 id={`gallery-${c.id}`}>{c.title}</h2>
              <p className="text-muted">{c.blurb}</p>
              <PhotoGallery photos={photos} />
            </section>
          )
        })}

        <div className="mt-10">
          {rest.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </div>
      </PageShell>
    </>
  )
}
