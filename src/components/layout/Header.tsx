import Link from 'next/link'
import { site } from '@/content/site'
import { MainNav } from './MainNav'

/**
 * Top utility bar + masthead + nav — the standard institutional header
 * arrangement of the period.
 */
export function Header() {
  return (
    <header>
      {/* ---- utility bar ---- */}
      <div className="chrome-topbar text-white">
        <div className="boxed flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
          <p className="m-0">
            <a href={`mailto:${site.email}`} className="text-white hover:text-jnu-100">
              {site.email}
            </a>
            {site.phone ? (
              <>
                <span className="mx-2 text-jnu-300" aria-hidden="true">
                  |
                </span>
                <a href={`tel:${site.phone}`} className="text-white hover:text-jnu-100">
                  {site.phone}
                </a>
              </>
            ) : null}
          </p>
          <nav aria-label="Utility" className="flex items-center gap-4">
            <Link href="/notices/" className="text-white hover:text-jnu-100">
              Notices
            </Link>
            <Link href="/results/" className="text-white hover:text-jnu-100">
              Results
            </Link>
            <Link href="/verify/" className="text-white hover:text-jnu-100">
              Verify Certificate
            </Link>
            <Link href="/contact/" className="text-white hover:text-jnu-100">
              Contact
            </Link>
          </nav>
        </div>
      </div>

      {/* ---- masthead ---- */}
      <div className="border-b border-hair bg-white">
        <div className="boxed flex flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            {/* Replace with the institution's real crest at /public/images/logo.png */}
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-lg text-white"
              style={{ background: 'linear-gradient(to bottom,#3d87c8,#185484)' }}
              aria-hidden="true"
            >
              JNU
            </span>
            <span>
              <span className="block font-display text-[21px] uppercase leading-tight tracking-wide text-jnu-800">
                {site.name}
              </span>
              <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                {site.tagline}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/admission/process/" className="btn btn-sand">
              Admission
            </Link>
            <Link href="/admission/download-forms/" className="btn btn-secondary">
              Downloads
            </Link>
          </div>
        </div>
      </div>

      <MainNav />
    </header>
  )
}
