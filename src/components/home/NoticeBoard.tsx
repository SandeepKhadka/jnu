import Link from 'next/link'
import type { NoticeDTO } from '@/lib/content-dto'
import { formatNoticeDate } from '@/lib/content-types'

/**
 * Dated notice list with the era's [View] affordance.
 * Server-rendered from build-time content, so every entry is in the HTML
 * source and indexable — see the note at the top of content/notices.ts.
 */
export function NoticeBoard({ notices, limit = 6 }: { notices: NoticeDTO[]; limit?: number }) {
  const items = notices.slice(0, limit)

  return (
    <div className="panel">
      <h2 className="panel-head m-0 flex items-center justify-between">
        <span>Notices &amp; Circulars</span>
        <Link href="/notices/" className="text-[11px] font-semibold uppercase tracking-wide">
          All
        </Link>
      </h2>
      <div className="panel-body p-0">
        <ul className="m-0 list-none p-0">
          {items.map((n) => {
            // PDFs must use a plain anchor: next/link prefetches its target as
            // a route, which requests "<file>.pdf.txt" and 404s.
            const target = n.href ?? n.fileUrl
            const isFile = !n.href && !!n.fileUrl
            return (
              <li key={n.id} className="border-b border-hair px-4 py-3 last:border-b-0">
                <div className="flex items-baseline gap-3">
                  <time
                    dateTime={n.date}
                    className="tnum shrink-0 text-xs text-muted"
                  >
                    {formatNoticeDate(n.date)}
                  </time>
                  <span className="shrink-0 rounded-sm border border-hair bg-shell px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                    {n.category}
                  </span>
                </div>
                <p className="m-0 mt-1 text-[13.5px] leading-snug">
                  {!target ? (
                    n.title
                  ) : isFile ? (
                    <a href={target} className="no-underline hover:underline">
                      {n.title}
                    </a>
                  ) : (
                    <Link href={target} className="no-underline hover:underline">
                      {n.title}
                    </Link>
                  )}
                  {n.pinned ? (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-sand-600">
                      Important
                    </span>
                  ) : null}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
