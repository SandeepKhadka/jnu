import Link from "next/link";
import { getBranding, getSetting, getSite } from "@/lib/content";

export async function Footer() {
  const [site, branding, quickLinks, recognition] = await Promise.all([
    getSite(),
    getBranding(),
    getSetting("footerLinks"),
    getSetting("recognition"),
  ]);

  return (
    <footer className="mt-10">
      <div className="bg-jnu-800 text-jnu-100">
        <div className="boxed grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="sr-only">{site.name}</h2>
            {/* On a white plate: the lockup's navy lettering disappears on the
                footer's navy background. Lazy — it is below the fold. */}
            <span className="mb-3 inline-block rounded bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logo.src}
                srcSet={branding.logo.srcSet}
                sizes="200px"
                alt=""
                width={branding.logo.width}
                height={branding.logo.height}
                loading="lazy"
                className="block h-12 w-auto"
              />
            </span>
            <p className="m-0 text-[13px] leading-relaxed text-jnu-200">
              {site.tagline}
            </p>
            {/* Shown only once the registrar has recorded it WITH evidence. */}
            {recognition.ugcStatus && recognition.evidence ? (
              <p className="mt-3 text-[13px] text-jnu-200">
                {recognition.ugcStatus}
              </p>
            ) : null}
          </div>

          <div>
            <h2 className="mb-3 font-display text-[15px] uppercase tracking-wide text-white">
              Quick Links
            </h2>
            <ul className="m-0 list-none space-y-1.5 p-0 text-[13px]">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-jnu-100 no-underline hover:text-white hover:underline"
                  >
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
            © {site.established ? `${site.established}–` : ""}{new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link
              href="/privacy/"
              className="text-jnu-200 no-underline hover:text-white hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/contact/"
              className="text-jnu-200 no-underline hover:text-white hover:underline"
            >
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
  );
}
