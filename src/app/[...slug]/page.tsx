import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { contentPages, pageByPath, type Block, type ContentPage } from '@/content/pages'
import { faculties } from '@/content/programmes'
import { PageShell } from '@/components/layout/PageShell'
import { pageMetadata } from '@/lib/seo'

/**
 * Renders every static content page from content/pages.ts.
 *
 * Next.js resolves explicit routes (/results, /verify, /admin, /programmes/[slug])
 * ahead of this catch-all, so those are unaffected.
 */

/**
 * Set to true to surface maintainer TODO notes on the rendered pages — useful
 * when working through the outstanding content, off for anything anyone else
 * will look at.
 */
const SHOW_MAINTAINER_NOTES = process.env.NEXT_PUBLIC_SHOW_MAINTAINER_NOTES === 'true'

function toParams(path: string) {
  return { slug: path.split('/').filter(Boolean) }
}

export function generateStaticParams() {
  return contentPages.map((p) => toParams(p.path))
}

function resolve(slug: string[] | undefined): ContentPage | undefined {
  const path = `/${(slug ?? []).join('/')}/`
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
      {page.body.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}

      {/* The faculty index gets its real listing rendered from the catalogue. */}
      {page.path === '/programmes/' ? <FacultyIndex /> : null}
    </PageShell>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return <h2>{block.text}</h2>
    case 'h3':
      return <h3>{block.text}</h3>
    case 'p':
      return <p>{block.text}</p>
    case 'ul':
      return (
        <ul>
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol>
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'note': {
      // Reader-facing notes always render. Maintainer notes are build-time
      // TODOs — they stay in the source so the outstanding work is tracked,
      // but they must not show on a page someone is actually reading.
      if (block.audience === 'maintainer' && !SHOW_MAINTAINER_NOTES) return null

      return (
        <aside className="my-5 rounded border border-hair border-l-[3px] border-l-sand-500 bg-white px-4 py-3">
          <p className="m-0 text-[13px] text-muted">
            <strong className="text-jnu-800">Please note: </strong>
            {block.text}
          </p>
        </aside>
      )
    }
  }
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
            {f.programmes.length} programme{f.programmes.length === 1 ? '' : 's'} ·{' '}
            {[...new Set(f.programmes.map((p) => p.award))].join(', ')}
          </span>
        </Link>
      ))}
    </div>
  )
}
