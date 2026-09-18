import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { contentPages, pageByPath, type ContentPage } from '@/content/pages'
import { faculties } from '@/content/programmes'
import { Blocks } from '@/components/content/Blocks'
import { PageShell } from '@/components/layout/PageShell'
import { pageMetadata } from '@/lib/seo'

/**
 * Renders every static content page from content/pages.ts.
 *
 * Next.js resolves explicit routes (/results, /verify, /admin,
 * /programmes/[slug], /admission/process) ahead of this catch-all, so those
 * are unaffected. Paths that have their own page file are excluded from
 * generateStaticParams below, so the two never both claim the same URL.
 */

/** Content paths that have a dedicated route file and must not be generated here. */
const OWNED_ELSEWHERE = new Set(['/admission/process/', '/photo-tour/'])

function toParams(path: string) {
  return { slug: path.split('/').filter(Boolean) }
}

export function generateStaticParams() {
  return contentPages.filter((p) => !OWNED_ELSEWHERE.has(p.path)).map((p) => toParams(p.path))
}

function resolve(slug: string[] | undefined): ContentPage | undefined {
  const path = `/${(slug ?? []).join('/')}/`
  if (OWNED_ELSEWHERE.has(path)) return undefined
  return pageByPath(path)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = resolve(slug)
  if (!page) return {}

  return pageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
  })
}

export default async function ContentRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = resolve(slug)
  if (!page) notFound()

  return (
    <PageShell title={page.title} intro={page.intro} crumbs={page.crumbs}>
      <Blocks blocks={page.body} />

      {/* The programmes index gets its real listing rendered from the catalogue. */}
      {page.path === '/programmes/' ? <FacultyIndex /> : null}
    </PageShell>
  )
}

function FacultyIndex() {
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
