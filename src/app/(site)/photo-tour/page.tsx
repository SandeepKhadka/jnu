import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockView } from '@/components/content/Blocks'
import { PhotoGallery } from '@/components/gallery/PhotoGallery'
import { PageShell } from '@/components/layout/PageShell'
import { JsonLd } from '@/components/seo/JsonLd'
import { getGallery, getPage, getSite } from '@/lib/content'
import { pickVariant } from '@/lib/media-shared'
import { absoluteUrl, pageMetadata } from '@/lib/seo'

/**
 * /photo-tour/ has its own route because it renders the gallery (Admin →
 * Gallery). The prose is the CMS page at this path; the catch-all excludes it.
 */

export async function generateMetadata(): Promise<Metadata> {
  const [page, gallery, site] = await Promise.all([getPage('/photo-tour/'), getGallery(), getSite()])
  // Share this page with a campus photograph rather than the generic card.
  const first = gallery.flatMap((c) => c.photos)[0]
  const share = first ? pickVariant(first.variants, 1200)?.path : undefined
  return pageMetadata({
    title: page?.title ?? 'Photo Tour',
    description: page?.description ?? `Photographs of the ${site.name} campus.`,
    path: '/photo-tour/',
    ogImage: share,
  })
}

export default async function PhotoTourPage() {
  const [page, gallery, site] = await Promise.all([getPage('/photo-tour/'), getGallery(), getSite()])
  if (!page) notFound()

  const photos = gallery.flatMap((c) => c.photos)

  /**
   * ImageGallery schema: each photograph as an ImageObject with its caption,
   * so the images surface in image search with the right description.
   */
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `Photo Tour — ${site.name}`,
    url: absoluteUrl('/photo-tour/'),
    about: { '@id': absoluteUrl('/#organization') },
    image: photos.map((p) => ({
      '@type': 'ImageObject',
      contentUrl: absoluteUrl(pickVariant(p.variants, 1200)?.path ?? ''),
      name: p.caption,
      caption: p.alt,
      width: p.width,
      height: p.height,
    })),
  }

  // Intro paragraph first, then the galleries, then the remaining prose.
  const [intro, ...rest] = page.body

  return (
    <>
      {photos.length ? <JsonLd data={schema} /> : null}
      <PageShell title={page.title} intro={page.intro ?? undefined} crumbs={page.crumbs}>
        {intro ? <BlockView block={intro} /> : null}

        {gallery.map((c) =>
          c.photos.length === 0 ? null : (
            <section key={c.id} aria-labelledby={`gallery-${c.slug}`} className="mt-8">
              <h2 id={`gallery-${c.slug}`}>{c.title}</h2>
              {c.blurb ? <p className="text-muted">{c.blurb}</p> : null}
              <PhotoGallery photos={c.photos} />
            </section>
          )
        )}

        <div className="mt-10">
          {rest.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </div>
      </PageShell>
    </>
  )
}
