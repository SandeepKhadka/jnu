import Link from 'next/link'
import type { Metadata } from 'next'

import { site } from '@/content/site'
import { faculties } from '@/content/programmes'
import { Hero } from '@/components/home/Hero'
import { Ticker } from '@/components/home/Ticker'
import { NoticeBoard } from '@/components/home/NoticeBoard'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata, faqSchema } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: site.defaultTitle,
  description: site.defaultDescription,
  path: '/',
})

const homeFaqs = [
  {
    q: 'Which programmes does Jodhpur National University offer?',
    a:
      'Programmes are offered across eight faculties: Engineering & Technology, Management, ' +
      'Pharmaceutical Sciences, Computer Application, Applied Sciences & Nursing, Law, ' +
      'Education, and Arts & Commerce.',
  },
  {
    q: 'Where is the university located?',
    a: `The campus is on Jhanwar Road, Boranada, Jodhpur, Rajasthan. The administrative office is at ${site.admissionOffice.lines.join(', ')}.`,
  },
  {
    q: 'How do I check my examination results?',
    a:
      'Published results can be viewed from the Examination Results page in the Student Zone ' +
      'by entering your roll number. Results appear only once the examination cell has ' +
      'published them.',
  },
  {
    q: 'How can an employer verify a certificate?',
    a:
      'Use the Certificate Verification page. Entering the certificate number returns the ' +
      'verification status held in the university record. Certificates not present in the ' +
      'record are reported as not verified.',
  },
]

const quickCards = [
  { label: 'Admission Process', href: '/admission/process/', icon: '✎', text: 'Eligibility, dates and how to apply.' },
  { label: 'Fee Structure', href: '/admission/fee-structure/', icon: '₹', text: 'Programme-wise fees and payment schedule.' },
  { label: 'Examination Results', href: '/results/', icon: '◈', text: 'Check published results by roll number.' },
  { label: 'Certificate Verification', href: '/verify/', icon: '✓', text: 'Employers and institutions can verify a certificate.' },
]

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqSchema(homeFaqs)} />

      <Hero />
      <Ticker />

      {/* ---- quick access ---- */}
      <section className="boxed py-9" aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="sr-only">
          Quick access
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickCards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="panel block p-5 text-center no-underline transition-shadow hover:shadow-raised"
            >
              <span className="iconbox-badge font-display text-xl" aria-hidden="true">
                {c.icon}
              </span>
              <span className="mb-1 block font-display text-[15px] uppercase tracking-wide text-jnu-800">
                {c.label}
              </span>
              <span className="block text-[13px] text-muted">{c.text}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- about + notices ---- */}
      <section className="border-y border-hair bg-white py-9">
        <div className="boxed grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="prose-jnu min-w-0">
            <h2 className="rule-heading">About the University</h2>
            <p>
              {site.name} offers professional and technical education across eight faculties
              from its campus on Jhanwar Road, Boranada, Jodhpur. Teaching is organised
              through departmental laboratories, workshops, a central library and a
              computing facility.
            </p>
            <p>
              Programmes span undergraduate, postgraduate and doctoral levels, with a
              curriculum structured around semester examinations and continuous internal
              assessment. Each faculty page lists its programmes with duration, award and
              eligibility.
            </p>
            <p className="mt-5">
              <Link href="/about/" className="btn btn-primary">
                More about JNU
              </Link>
            </p>
          </div>
          <div className="min-w-0">
            <NoticeBoard limit={6} />
          </div>
        </div>
      </section>

      {/* ---- faculties ---- */}
      <section className="boxed py-9" aria-labelledby="faculties-heading">
        <h2 id="faculties-heading" className="rule-heading">
          Faculties
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {faculties.map((f) => (
            <Link
              key={f.slug}
              href={`/faculty/${f.slug}/`}
              className="panel block p-4 no-underline transition-shadow hover:shadow-raised"
            >
              <span className="mb-1 block font-display text-[14px] uppercase tracking-wide text-jnu-800">
                {f.name}
              </span>
              <span className="tnum block text-xs text-muted">
                {f.programmes.length} programme{f.programmes.length === 1 ? '' : 's'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- FAQ, visible and matching the FAQPage schema above ---- */}
      <section className="border-t border-hair bg-white py-9" aria-labelledby="faq-heading">
        <div className="boxed">
          <h2 id="faq-heading" className="rule-heading">
            Frequently Asked Questions
          </h2>
          <dl className="m-0 grid gap-5 md:grid-cols-2">
            {homeFaqs.map((f) => (
              <div key={f.q}>
                <dt className="mb-1 font-semibold text-jnu-800">{f.q}</dt>
                <dd className="m-0 text-[13.5px] leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  )
}
