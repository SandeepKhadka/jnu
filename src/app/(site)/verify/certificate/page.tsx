import type { Metadata } from 'next'

import { PageShell } from '@/components/layout/PageShell'
import { CertificateSerialVerify } from '@/components/student/CertificateSerialVerify'
import { pageMetadata } from '@/lib/seo'

/**
 * Where the QR code on a printed degree points. noindex: every useful URL of
 * this page carries a serial, and indexing those would publish graduates'
 * records. /verify/ remains the indexable verification page.
 */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Verify a Degree Certificate',
    description:
      'Confirm a Jodhpur National University degree certificate against the register using ' +
      'the serial or QR code printed on it.',
    path: '/verify/certificate/',
    noindex: true,
  })
}

export default function VerifyCertificatePage() {
  return (
    <PageShell
      title="Verify a Degree Certificate"
      crumbs={[
        { name: 'Student Zone', path: '/student-zone/' },
        { name: 'Certificate Verification', path: '/verify/' },
        { name: 'Degree Certificate', path: '/verify/certificate/' },
      ]}
      intro="Check a printed degree against the university certificate register."
    >
      <CertificateSerialVerify />
    </PageShell>
  )
}
