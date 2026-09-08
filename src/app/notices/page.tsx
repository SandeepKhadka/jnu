import type { Metadata } from 'next'
import Link from 'next/link'

import { sortedNotices, formatNoticeDate } from '@/content/notices'
import { PageShell } from '@/components/layout/PageShell'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata, absoluteUrl } from '@/lib/seo'
import { site } from '@/content/site'

export const metadata: Metadata = pageMetadata({
  title: 'Notices & Circulars',
  description:
    'Examination, admission and general notices issued by Jodhpur National University, most recent first.',
  path: '/notices/',
})

/**
 * ItemList schema over the notice board. Notices are build-time content, so
 * every entry below is in the static HTML and indexable — see the note at the
 * top of content/notices.ts for why that matters.
 */
function noticeListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Notices and circulars — ${site.name}`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: sortedNotices.length,
    itemListElement: sortedNotices.map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: n.title,
      url: absoluteUrl(n.href ?? n.file ?? '/notices/'),
    })),
  }
}

export default function NoticesPage() {
  return (
    <>
      <JsonLd data={noticeListSchema()} />
      <PageShell
        title="Notices & Circulars"
        crumbs={[
          { name: 'Student Zone', path: '/student-zone/' },
          { name: 'Notices & Circulars', path: '/notices/' },
        ]}
        intro="Examination, admission and general notices, most recent first."
      >
        <ul className="m-0 list-none p-0">
          {sortedNotices.map((n) => {
            const target = n.href ?? n.file
            return (
              <li
                key={n.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-hair py-3 first:border-t"
              >
                <time dateTime={n.date} className="tnum w-28 shrink-0 text-[13px] text-muted">
                  {formatNoticeDate(n.date)}
                </time>
                <span className="shrink-0 rounded-sm border border-hair bg-shell px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  {n.category}
                </span>
                <span className="min-w-0 flex-1 text-[14px]">
                  {target ? (
                    <Link href={target} className="no-underline hover:underline">
                      {n.title}
                    </Link>
                  ) : (
                    n.title
                  )}
                  {n.pinned ? (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-sand-600">
                      Important
                    </span>
                  ) : null}
                </span>
                {n.file ? (
                  <a href={n.file} className="shrink-0 text-[12px] uppercase tracking-wide">
                    [ PDF ]
                  </a>
                ) : null}
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-[13px] text-muted">
          Notices are also announced on the campus notice board. Where a notice and this
          page differ, the signed notice issued by the office prevails.
        </p>
      </PageShell>
    </>
  )
}
