import Link from 'next/link'
import { site } from '@/content/site'
import { quickLinks } from '@/content/nav'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10">
      <div className="bg-jnu-800 text-jnu-100">
        <div className="boxed grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="mb-3 font-display text-[15px] uppercase tracking-wide text-white">
              {site.shortName}
            </h2>
            <p className="m-0 text-[13px] leading-relaxed text-jnu-200">{site.tagline}</p>
            {site.recognition.ugcStatus ? (
              <p className="mt-3 text-[13px] text-jnu-200">{site.recognition.ugcStatus}</p>
            ) : null}
          </div>

          <div>
            <h2 className="mb-3 font-display text-[15px] uppercase tracking-wide text-white">
              Quick Links
            </h2>
            <ul className="m-0 list-none space-y-1.5 p-0 text-[13px]">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-jnu-100 no-underline hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[15px] uppercase tracking-wide text-white">
              {site.campus.label}
            </h2>
            <address className="m-0 text-[13px] not-italic leading-relaxed text-jnu-200">
              {site.campus.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[15px] uppercase tracking-wide text-white">
              {site.admissionOffice.label}
            </h2>
            <address className="m-0 text-[13px] not-italic leading-relaxed text-jnu-200">
              {site.admissionOffice.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <a
                href={`mailto:${site.email}`}
                className="mt-2 inline-block text-jnu-100 no-underline hover:text-white hover:underline"
              >
                {site.email}
              </a>
            </address>
          </div>
        </div>
      </div>

      <div className="chrome-topbar text-jnu-200">
        <div className="boxed flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
          <p className="m-0">
            © {year} {site.legalName}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link href="/privacy/" className="text-jnu-200 no-underline hover:text-white hover:underline">
              Privacy
            </Link>
            <Link href="/contact/" className="text-jnu-200 no-underline hover:text-white hover:underline">
              Contact
            </Link>
            {/* Admin entry point lives on the public site, as requested. */}
            <Link
              href="/admin/login/"
              rel="nofollow"
              className="text-jnu-200 no-underline hover:text-white hover:underline"
            >
              Staff Login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
