import type { Metadata } from 'next'
import { Open_Sans, Allerta } from 'next/font/google'
import './globals.css'

import { SiteProvider } from '@/components/site/SiteProvider'
import { getBranding, getSetting, getSite } from '@/lib/content'
import { SITE_URL } from '@/lib/site-url'

/**
 * Root layout: document shell, fonts, and the site settings every client
 * component can read. It renders no chrome — the public site's header and
 * footer are in (site)/layout.tsx, and the admin panel has its own layout.
 *
 * Same two families the original site loaded (Open Sans + Allerta), but
 * self-hosted at build time by next/font — no render-blocking request to
 * fonts.googleapis.com, and no layout shift.
 */
const openSans = Open_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-open-sans' })
const allerta = Allerta({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-allerta' })

export async function generateMetadata(): Promise<Metadata> {
  const [site, branding] = await Promise.all([getSite(), getBranding()])
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: site.defaultTitle, template: site.titleTemplate },
    description: site.defaultDescription,
    applicationName: site.name,
    authors: [{ name: site.legalName }],
    formatDetection: { telephone: false, address: false, email: false },
    robots: { index: true, follow: true },
    // Favicon and home-screen icon follow the crest set in Branding; the
    // files in public/images/brand are the fallback when none is set.
    icons: {
      icon: branding.crest === '/images/brand/jnu-crest.png' ? '/images/brand/icon.png' : branding.crest,
      apple: branding.crest === '/images/brand/jnu-crest.png' ? '/images/brand/apple-icon.png' : branding.crest,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, branding, recognition, examinations] = await Promise.all([
    getSite(),
    getBranding(),
    getSetting('recognition'),
    getSetting('examinations'),
  ])

  return (
    <html lang="en-IN" className={`${openSans.variable} ${allerta.variable}`}>
      <body className="min-h-screen">
        <SiteProvider
          value={{
            site,
            branding,
            recognition,
            // No signature here — see SiteProvider for why.
            examinations: {
              controllerTitle: examinations.controllerTitle,
              place: examinations.place,
              centre: examinations.centre,
            },
          }}
        >
          {children}
        </SiteProvider>
      </body>
    </html>
  )
}
