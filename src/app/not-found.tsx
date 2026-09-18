import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getSetting } from '@/lib/content'

/**
 * A 404 that recovers the visitor rather than dead-ending them.
 * Matters here because the old site's URLs all ended in /index.html — anyone
 * arriving from a stale search result or bookmark lands on this page, so the
 * redirect map (see README) plus this list is how that traffic is retained.
 */
/**
 * Rendered outside the (site) layout, so it brings its own header and footer.
 */
export default async function NotFound() {
  const quickLinks = await getSetting('footerLinks')
  return (
    <>
    <Header />
    <main id="main">
    <div className="boxed py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="m-0 font-display text-[13px] uppercase tracking-[0.2em] text-sand-600">
          Error 404
        </p>
        <h1 className="mb-3 mt-2 font-display text-[28px] text-jnu-800">Page not found</h1>
        <p className="m-0 text-[14px] text-muted">
          The page you requested does not exist. It may have been moved or removed. The
          links below cover the most requested pages.
        </p>
      </div>

      <ul className="mx-auto mt-8 grid max-w-2xl list-none gap-3 p-0 sm:grid-cols-2">
        {quickLinks.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="panel block px-4 py-3 text-[13.5px] no-underline transition-shadow hover:shadow-raised"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center">
        <Link href="/" className="btn btn-primary">
          Return to the home page
        </Link>
      </p>
    </div>
    </main>
    <Footer />
    </>
  )
}
