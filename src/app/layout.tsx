import type { Metadata } from 'next'
import { Open_Sans, Allerta } from 'next/font/google'
import './globals.css'

import { site } from '@/content/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema, absoluteUrl } from '@/lib/seo'

/**
 * Same two families the original site loaded (Open Sans + Allerta), but
 * self-hosted at build time by next/font — so no render-blocking request to
 * fonts.googleapis.com, and no layout shift.
 */
const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
})

const allerta = Allerta({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-allerta',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.defaultTitle,
    template: site.titleTemplate,
  },
  description: site.defaultDescription,
  applicationName: site.name,
  authors: [{ name: site.legalName }],
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: absoluteUrl('/') },
  robots: { index: true, follow: true },
  // Favicon and home-screen icon: src/app/icon.png and apple-icon.png, cut
  // from the university crest by scripts/optimise-images.ts.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${openSans.variable} ${allerta.variable}`}>
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>

        {/* Sitewide schema, emitted once in the static HTML. */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />

        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
