import Link from 'next/link'
import { getBranding, getResolvedMenu, getSite } from '@/lib/content'
import { CounsellingButton } from '@/components/site/CounsellingButton'
import { LoginMenu } from './LoginMenu'
import { MainNav } from './MainNav'
import { MobileBar } from './MobileBar'

/**
 * Top utility bar + masthead + nav — the standard institutional header
 * arrangement of the period.
 *
 * On a phone the utility bar IS the strip that follows scroll direction, with
 * the menu button at its right, so one element sits at the top instead of a
 * menu bar laid over the contact details. Its contents are built here, on the
 * server, and handed to MainNav to place: a server component may pass
 * rendered JSX to a client one, so the markup stays in one file while the
 * behaviour stays where the state lives.
 */
export async function Header() {
  const [site, branding, menu] = await Promise.all([getSite(), getBranding(), getResolvedMenu()])

  const utility = (
    <>
      <p className="m-0 min-w-0 truncate">
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
      <nav aria-label="Utility" className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
    </>
  )

  return (
    <header>
      <MobileBar items={menu} utility={utility} />

      {/* ---- utility bar: desktop only. The phone gets MobileBar's strip. ---- */}
      <div className="chrome-topbar hidden text-white lg:block">
        <div className="boxed flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
          {utility}
        </div>
      </div>

      {/* ---- masthead ---- */}
      <div className="border-b border-hair bg-white">
        <div className="boxed flex flex-wrap items-center justify-between gap-4 py-6">
          <Link
            href="/"
            className="block w-full shrink-0 no-underline lg:w-auto"
            aria-label={`${site.name} — home`}
          >
            {/*
              The university's own lockup: crest with the name in Hindi and
              English. Explicit width and height reserve the space before the
              file arrives, so the header never shifts (CLS). Eager, because
              it is above the fold on every page; small enough (9 KB at 1x)
              that it does not compete with the hero image.

              Below lg it takes a line to itself and is sized by WIDTH, not
              height. The lockup is a wide crest-plus-wordmark, so setting a
              tall height to make it "bigger" on a phone would push it past
              the screen edge; capping the width instead makes it as large as
              the line allows and keeps the Hindi and English names readable.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logo.src}
              srcSet={branding.logo.srcSet}
              sizes="(min-width: 1024px) 340px, (min-width: 640px) 460px, 92vw"
              alt={site.name}
              width={branding.logo.width}
              height={branding.logo.height}
              className="mx-auto h-auto w-full max-w-[360px] sm:max-w-[460px] lg:mx-0 lg:h-24 lg:w-auto lg:max-w-none"
            />
          </Link>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 lg:w-auto lg:justify-end">
            <CounsellingButton />
            <Link href="/admission/process/" className="btn btn-primary max-sm:px-2.5 max-sm:text-[11px]">
              Admission
            </Link>
            <Link href="/admission/download-forms/" className="btn btn-secondary hidden sm:inline-block">
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
