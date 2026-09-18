import Link from 'next/link'
import { getBranding, getResolvedMenu, getSite } from '@/lib/content'
import { LoginMenu } from './LoginMenu'
import { MainNav } from './MainNav'

/**
 * Top utility bar + masthead + nav — the standard institutional header
 * arrangement of the period.
 */
export async function Header() {
  const [site, branding, menu] = await Promise.all([getSite(), getBranding(), getResolvedMenu()])

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
          <Link href="/" className="block shrink-0 no-underline" aria-label={`${site.name} — home`}>
            {/*
              The university's own lockup: crest with the name in Hindi and
              English. Explicit width and height reserve the space before the
              file arrives, so the header never shifts (CLS). Eager, because
              it is above the fold on every page; small enough (9 KB at 1x)
              that it does not compete with the hero image.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logo.src}
              srcSet={branding.logo.srcSet}
              sizes="(min-width: 640px) 230px, 200px"
              alt={site.name}
              width={branding.logo.width}
              height={branding.logo.height}
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/admission/process/" className="btn btn-sand">
              Admission
            </Link>
            <Link href="/admission/download-forms/" className="btn btn-secondary">
              Downloads
            </Link>
            <LoginMenu />
          </div>
        </div>
      </div>

      <MainNav items={menu} />
    </header>
  )
}
