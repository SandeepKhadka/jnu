import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/seo'

/** Public site chrome: header, footer and the sitewide schema. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [org, website] = await Promise.all([organizationSchema(), websiteSchema()])
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
    </>
  )
}
