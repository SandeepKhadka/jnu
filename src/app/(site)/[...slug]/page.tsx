import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Blocks } from '@/components/content/Blocks'
import { PageShell } from '@/components/layout/PageShell'
import { getFaculties, getPage, getPublishedPagePaths } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'

/**
 * Renders every content page edited under Admin → Pages.
 *
 * Existing pages are prerendered at build time. A page an administrator
 * creates later has no build-time HTML; `dynamicParams` (the default) renders
 * it on its first request and caches it as static from then on — so a new
 * page is live the moment it is saved, with no redeploy.
 *
 * Paths that have their own route file are excluded so the two never both
 * claim the same URL.
 */

/** Content paths with a dedicated route file; their prose still comes from the CMS. */
const OWNED_ELSEWHERE = new Set([
  '/admission/process/',
  '/photo-tour/',
  '/affiliations/',
  '/admission/syllabus/',
])

export async function generateStaticParams() {
  const pages = await getPublishedPagePaths()
  return pages
    .filter((p) => !OWNED_ELSEWHERE.has(p.path))
    .map((p) => ({ slug: p.path.split('/').filter(Boolean) }))
}

async function resolve(slug: string[] | undefined) {
  const path = `/${(slug ?? []).join('/')}/`
  if (OWNED_ELSEWHERE.has(path)) return null
  return getPage(path)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await resolve(slug)
  if (!page) return {}
  return pageMetadata({ title: page.title, description: page.description, path: page.path })
}

export default async function ContentRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = await resolve(slug)
  if (!page) notFound()

  return (
    <PageShell title={page.title} intro={page.intro ?? undefined} crumbs={page.crumbs}>
      <Blocks blocks={page.body} />

      {/* The programmes index gets its listing rendered from the catalogue. */}
      {page.path === '/programmes/' ? <FacultyIndex /> : null}
    </PageShell>
  )
}

async function FacultyIndex() {
  const faculties = await getFaculties()
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {faculties.map((f) => (
        <Link
          key={f.slug}
          href={`/programmes/${f.slug}/`}
          className="panel block p-4 no-underline transition-shadow hover:shadow-raised"
        >
          <span className="mb-1 block font-display text-[15px] uppercase tracking-wide text-jnu-800">
            {f.name}
          </span>
          <span className="mb-2 block text-[13px] text-muted">{f.summary}</span>
          <span className="tnum block text-xs text-muted">
            {f.programmes.length === 0
              ? 'Programme list being published'
              : `${f.programmes.length} programme${f.programmes.length === 1 ? '' : 's'} · ${[
                  ...new Set(f.programmes.map((p) => p.award)),
                ].join(', ')}`}
          </span>
        </Link>
      ))}
    </div>
  )
}
