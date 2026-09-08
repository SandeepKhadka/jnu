import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/seo'

export type Crumb = { name: string; path: string }

/**
 * Inner-page wrapper: breadcrumb bar, H1, optional sidebar.
 * Breadcrumbs are both visible navigation and BreadcrumbList schema — the
 * original site had the visible trail but no structured data behind it.
 */
export function PageShell({
  title,
  intro,
  crumbs,
  sidebar,
  children,
}: {
  title: string
  intro?: string
  crumbs: Crumb[]
  sidebar?: React.ReactNode
  children: React.ReactNode
}) {
  const trail: Crumb[] = [{ name: 'Home', path: '/' }, ...crumbs]

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      {/* ---- title bar ---- */}
      <div className="border-b border-hair bg-white">
        <div className="boxed flex flex-wrap items-baseline justify-between gap-2 py-5">
          <h1 className="m-0 font-display text-[26px] leading-tight text-jnu-800">{title}</h1>
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
              {trail.map((c, i) => {
                const last = i === trail.length - 1
                return (
                  <li key={c.path} className="flex items-center gap-1.5">
                    {last ? (
                      <span aria-current="page" className="text-ink">
                        {c.name}
                      </span>
                    ) : (
                      <>
                        <Link href={c.path} className="no-underline hover:underline">
                          {c.name}
                        </Link>
                        <span aria-hidden="true" className="text-hair">
                          /
                        </span>
                      </>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      </div>

      <div className="boxed py-8">
        <div className={sidebar ? 'grid gap-8 lg:grid-cols-[1fr_300px]' : ''}>
          <div className="prose-jnu min-w-0">
            {intro ? <p className="mb-6 text-[15px] leading-relaxed text-muted">{intro}</p> : null}
            {children}
          </div>
          {sidebar ? <aside className="min-w-0">{sidebar}</aside> : null}
        </div>
      </div>
    </>
  )
}
