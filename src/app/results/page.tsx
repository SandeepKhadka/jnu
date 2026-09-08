import type { Metadata } from 'next'
import { PageShell } from '@/components/layout/PageShell'
import { ResultLookup } from '@/components/student/ResultLookup'
import { pageMetadata } from '@/lib/seo'

/**
 * noindex, and absent from sitemap.xml + disallowed in robots.txt.
 *
 * This is not an SEO sacrifice — student marks were never something we wanted
 * in a search index, and having them indexed would be a DPDP Act problem.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Examination Results',
  description: 'Check published examination results by roll number.',
  path: '/results/',
  noindex: true,
})

export default function ResultsPage() {
  return (
    <PageShell
      title="Examination Results"
      crumbs={[
        { name: 'Student Zone', path: '/student-zone/' },
        { name: 'Examination Results', path: '/results/' },
      ]}
      intro="Enter your roll number to view a published examination result."
    >
      <ResultLookup />
    </PageShell>
  )
}
