import type { Metadata } from 'next'

import { getSite } from '@/lib/content'
import type { SiteSettings } from '@/lib/content-types'
import { PageShell } from '@/components/layout/PageShell'
import { EnquiryForm } from '@/components/student/EnquiryForm'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata, absoluteUrl } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Contact',
    description:
      'Contact Jodhpur National University — campus address on Jhanwar Road, Boranada, administrative office in Jodhpur, and enquiry form.',
    path: '/contact/',
  })
}

/** ContactPage + postal addresses — local-SEO relevant and absent from the original. */
function contactSchema(site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: absoluteUrl('/contact/'),
    about: { '@id': absoluteUrl('/#organization') },
    mainEntity: {
      '@type': 'EducationalOrganization',
      '@id': absoluteUrl('/#organization'),
      name: site.name,
      email: site.email,
      address: [
        {
          '@type': 'PostalAddress',
          name: site.campus.label,
          streetAddress: site.campus.lines.slice(0, -1).join(', '),
          addressLocality: 'Jodhpur',
          addressRegion: 'Rajasthan',
          addressCountry: 'IN',
        },
        {
          '@type': 'PostalAddress',
          name: site.admissionOffice.label,
          streetAddress: site.admissionOffice.lines.slice(0, -1).join(', '),
          addressLocality: 'Jodhpur',
          addressRegion: 'Rajasthan',
          postalCode: '342003',
          addressCountry: 'IN',
        },
      ],
    },
  }
}

export default async function ContactPage() {
  const site = await getSite()
  return (
    <>
      <JsonLd data={contactSchema(site)} />
      <PageShell
        title="Contact"
        crumbs={[{ name: 'Contact', path: '/contact/' }]}
        intro="Campus and administrative office addresses, and an enquiry form."
        sidebar={
          <div className="space-y-4">
            <div className="panel">
              <h2 className="panel-head m-0">{site.campus.label}</h2>
              <div className="panel-body">
                <address className="m-0 text-[13.5px] not-italic leading-relaxed">
                  {site.campus.lines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </div>
            </div>

            <div className="panel">
              <h2 className="panel-head m-0">{site.admissionOffice.label}</h2>
              <div className="panel-body">
                <address className="m-0 text-[13.5px] not-italic leading-relaxed">
                  {site.admissionOffice.lines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
                <p className="m-0 mt-3 text-[13.5px]">
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </p>
              </div>
            </div>
          </div>
        }
      >
        <EnquiryForm />

        <h2>Before you visit</h2>
        <p>
          Admission enquiries are handled at the administrative office on Residency Road.
          Examination matters are handled by the examination cell at the campus on Jhanwar
          Road, Boranada.
        </p>

        <aside className="my-5 rounded border border-hair border-l-[3px] border-l-sand-500 bg-white px-4 py-3">
          <p className="m-0 text-[13px] text-muted">
            <strong className="text-jnu-800">A note on payments: </strong>
            the university does not collect fees through individuals or through accounts
            other than those confirmed in writing by the administrative office. Always
            obtain a dated, stamped official receipt. Report anyone offering admission,
            results or certificates for a payment outside this process to the registrar.
          </p>
        </aside>
      </PageShell>
    </>
  )
}
