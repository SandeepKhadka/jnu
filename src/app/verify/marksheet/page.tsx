import type { Metadata } from 'next'

import { PageShell } from '@/components/layout/PageShell'
import { MarksheetVerify } from '@/components/student/MarksheetVerify'
import { pageMetadata } from '@/lib/seo'

/**
 * Where the QR code on a printed statement of marks points.
 *
 * noindex: the page itself is an empty form, and every useful URL of it
 * carries a serial in the query string. Indexing those would put individual
 * students' marks into search results.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Verify a Statement of Marks',
  description:
    'Confirm that a printed Jodhpur National University statement of marks matches the ' +
    'examination record, using the serial number or QR code on it.',
  path: '/verify/marksheet/',
  noindex: true,
})

export default function VerifyMarksheetPage() {
  return (
    <PageShell
      title="Verify a Statement of Marks"
      crumbs={[
        { name: 'Student Zone', path: '/student-zone/' },
        { name: 'Certificate Verification', path: '/verify/' },
        { name: 'Statement of Marks', path: '/verify/marksheet/' },
      ]}
      intro="Check a printed statement of marks against the university examination record."
    >
      <MarksheetVerify />
    </PageShell>
  )
}
