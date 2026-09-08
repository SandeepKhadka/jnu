import Link from 'next/link'
import { sortedNotices, formatNoticeDate } from '@/content/notices'

/**
 * "Latest Updates" scrolling strip — the original used the Ditty News Ticker
 * and News Headline Ticker plugins (two separate jQuery plugins, both loaded
 * on every page). This is CSS-only, server-rendered, and the text is real HTML
 * in the source so it is indexable.
 *
 * Pauses on hover and focus; fully disabled under prefers-reduced-motion.
 */
export function Ticker() {
  const items = sortedNotices.slice(0, 6)
  if (items.length === 0) return null

  const row = (keyPrefix: string, ariaHidden: boolean) => (
    <span className="inline-flex shrink-0" aria-hidden={ariaHidden || undefined}>
      {items.map((n) => (
        <span key={`${keyPrefix}-${n.id}`} className="inline-flex items-center">
          <span className="mx-4 text-jnu-100/60" aria-hidden="true">
            •
          </span>
          <span className="tnum mr-2 text-jnu-100/80">{formatNoticeDate(n.date)}</span>
          {n.href ? (
            <Link href={n.href} className="text-white underline decoration-white/40 hover:decoration-white">
              {n.title}
            </Link>
          ) : n.file ? (
            <a
              href={n.file}
              className="text-white underline decoration-white/40 hover:decoration-white"
            >
              {n.title}
            </a>
          ) : (
            <span className="text-white">{n.title}</span>
          )}
        </span>
      ))}
    </span>
  )

  return (
    <section aria-label="Latest updates" className="border-b border-jnu-800 bg-jnu-500">
      <div className="boxed flex items-center gap-3 py-2">
        <h2 className="m-0 shrink-0 font-display text-[12px] uppercase tracking-[0.1em] text-white">
          Latest Updates
        </h2>
        <div className="ticker-viewport relative flex-1 overflow-hidden">
          <div className="ticker-track text-[13px]">
            {row('a', false)}
            {/* Duplicate track makes the -50% translate loop seamlessly. */}
            {row('b', true)}
          </div>
        </div>
        <Link
          href="/notices/"
          className="hidden shrink-0 text-[12px] font-semibold uppercase tracking-wide text-white underline decoration-white/40 hover:decoration-white sm:block"
        >
          View all
        </Link>
      </div>
    </section>
  )
}
