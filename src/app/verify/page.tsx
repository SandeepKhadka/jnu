import type { Metadata } from 'next'
import { PageShell } from '@/components/layout/PageShell'
import { CertificateVerify } from '@/components/student/CertificateVerify'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata, faqSchema } from '@/lib/seo'

/**
 * Indexable, unlike /results/ — and worth ranking for. "JNU certificate
 * verification" is a real query employers make, and owning that result is
 * both useful and reputationally valuable for the institution.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Certificate Verification',
  description:
    'Verify a Jodhpur National University certificate. Employers and institutions can ' +
    'confirm the status of a certificate number against the university record.',
  path: '/verify/',
})

const faqs = [
  {
    q: 'Who can use the certificate verification service?',
    a:
      'Anyone. Employers, universities and background-screening agencies can check a ' +
      'certificate number without an account or prior registration.',
  },
  {
    q: 'What does "Not verified" mean?',
    a:
      'The certificate number is not present in the university record. This may be a ' +
      'transcription error, or the document may not have been issued by the university. ' +
      'Contact the registrar before relying on the document.',
  },
  {
    q: 'What does "Revoked" mean?',
    a:
      'The certificate was issued and later withdrawn by the university. It must not be ' +
      'accepted as a valid credential.',
  },
  {
    q: 'Is a verification response itself a certificate?',
    a:
      'No. It confirms the existence and current status of a record in the university ' +
      'system. It is not a substitute for the certificate or an official transcript.',
  },
]

export default function VerifyPage() {
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <PageShell
        title="Certificate Verification"
        crumbs={[
          { name: 'Student Zone', path: '/student-zone/' },
          { name: 'Certificate Verification', path: '/verify/' },
        ]}
        intro="Confirm the status of a certificate number against the university record."
      >
        <CertificateVerify />

        <h2>How verification works</h2>
        <p>
          Records in this service are entered from the registrar&rsquo;s authoritative
          issuance register. A query returns one of three outcomes:{' '}
          <strong>Verified</strong> — the certificate is present in the record and in good
          standing; <strong>Revoked</strong> — it was issued and later withdrawn, and must
          not be accepted; <strong>Withheld</strong> — the record is under review.
        </p>
        <p>
          A number absent from the record returns <strong>Not verified</strong>. Because
          absence can result from a simple transcription error as easily as from a document
          that was never issued, please contact the registrar before drawing a conclusion.
        </p>

        <h2>Frequently asked questions</h2>
        <dl className="m-0 grid gap-5 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="mb-1 font-semibold text-jnu-800">{f.q}</dt>
              <dd className="m-0 text-[13.5px] leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </PageShell>
    </>
  )
}
