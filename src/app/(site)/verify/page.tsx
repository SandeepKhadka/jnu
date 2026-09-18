import type { Metadata } from 'next'
import { PageShell } from '@/components/layout/PageShell'
import { CertificateVerify } from '@/components/student/CertificateVerify'
import { JsonLd } from '@/components/seo/JsonLd'
import { getSite } from '@/lib/content'
import { pageMetadata, faqSchema } from '@/lib/seo'

/**
 * Indexable, unlike /results/ — and worth ranking for. "JNU certificate
 * verification" is a real query employers make, and owning that result is
 * both useful and reputationally valuable for the institution.
 *
 * The page indexes; the lookup behind it does not leak. The form POSTs, so no
 * roll number or date of birth ever reaches a URL, a log or a Referer header,
 * and nothing about any individual is rendered into the static HTML.
 */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Certificate Verification',
    description:
      'Verify a Jodhpur National University certificate. Employers and institutions can ' +
      'confirm the status of a certificate using the roll number and date of birth ' +
      'printed on it.',
    path: '/verify/',
  })
}

const faqsFor = (site: { verificationEmail: string }) => [
  {
    q: 'Who can use the certificate verification service?',
    a:
      'Anyone. Employers, universities and background-screening agencies can check a ' +
      'certificate without an account or prior registration.',
  },
  {
    q: 'What do I need in order to verify a certificate?',
    a:
      'The roll number and the date of birth, both as printed on the certificate. Both ' +
      'must match the university record exactly.',
  },
  {
    q: 'What does "Not verified" mean?',
    a:
      'No record matches the roll number and date of birth given. This may be a ' +
      'transcription error, or the document may not have been issued by the university. ' +
      `Contact ${site.verificationEmail} before relying on the document.`,
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
      'system. It is not a substitute for the certificate or an official transcript. For ' +
      `a signed verification notice on letterhead, write to ${site.verificationEmail}.`,
  },
]

export default async function VerifyPage() {
  const site = await getSite()
  const faqs = faqsFor(site)
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <PageShell
        title="Certificate Verification"
        crumbs={[
          { name: 'Student Zone', path: '/student-zone/' },
          { name: 'Certificate Verification', path: '/verify/' },
        ]}
        intro="Confirm the status of a certificate against the university record."
      >
        <CertificateVerify />

        <div className="no-print">
          <h2>How verification works</h2>
          <p>
            Records in this service are entered from the registrar&rsquo;s authoritative
            issuance register. A query returns one of three outcomes:{' '}
            <strong>Verified</strong> — the certificate is present in the record and in good
            standing; <strong>Revoked</strong> — it was issued and later withdrawn, and must
            not be accepted; <strong>Withheld</strong> — the record is under review.
          </p>
          <p>
            Where no record matches, the service returns <strong>Not verified</strong>. Because
            that can result from a simple transcription error as easily as from a document that
            was never issued, please write to{' '}
            <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a> before
            drawing a conclusion. Where a roll number is on record but nothing has been awarded
            against it, the service says so explicitly rather than reporting a failure.
          </p>
          <p>
            To protect the people in the register, the service is rate limited and does not
            reveal which half of a failed query was wrong.
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
        </div>
      </PageShell>
    </>
  )
}
