import type { Metadata } from 'next'
import Link from 'next/link'

import { PageShell } from '@/components/layout/PageShell'
import { ResultLookup } from '@/components/student/ResultLookup'
import { pageMetadata } from '@/lib/seo'

/**
 * noindex, absent from sitemap.xml, disallowed in robots.txt.
 *
 * Not an SEO sacrifice — student marks were never something we wanted in a
 * search index, and having them indexed would be a DPDP Act problem.
 *
 * This page takes a roll number alone and returns the published result, with
 * no sign-in, at the client's instruction. The disclosure that follows from
 * that is spelled out in src/app/api/results/lookup/route.ts, which is where
 * the decision about what to withhold actually lives.
 *
 * The signed-in portal at /student/ is unchanged and still carries the
 * photograph, contact details and correction requests. This page shows the
 * result and nothing else.
 */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Examination Results',
    description: 'Enter your roll number to view a published examination result.',
    path: '/results/',
    noindex: true,
  })
}

export default function ResultsPage() {
  return (
    <PageShell
      title="Examination Results"
      crumbs={[
        { name: 'Student Zone', path: '/student-zone/' },
        { name: 'Examination Results', path: '/results/' },
      ]}
      intro="Enter your roll number to view a published result. No sign-in is required."
    >
      <ResultLookup />

      <p className="mt-8 text-[13px] text-muted">
        Need your photograph, contact details or a correction request?{' '}
        <Link href="/student/" className="text-jnu-700">
          Sign in to the student portal
        </Link>
        .
      </p>
    </PageShell>
  )
}
