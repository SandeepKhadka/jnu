import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { NoticePopup } from '@/components/site/NoticePopup'
import { getSetting } from '@/lib/content'
import { organizationSchema, websiteSchema } from '@/lib/seo'

/** Public site chrome: header, footer and the sitewide schema. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [org, website, popupNotice] = await Promise.all([
    organizationSchema(),
    websiteSchema(),
    getSetting('popupNotice'),
  ])
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      {/* Sitewide schema, emitted once in the static HTML. */}
      <JsonLd data={[org, website]} />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      {/*
        Passed as data from the already-cached settings read, so the overlay
        costs no extra query and the page stays static — it mounts itself on
        the client after a short delay.
      */}
      <NoticePopup notice={popupNotice} />
    </>
  )
}
