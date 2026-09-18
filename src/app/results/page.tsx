import type { Metadata } from 'next'

import { PageShell } from '@/components/layout/PageShell'
import { StudentPortal } from '@/components/student/StudentPortal'
import { pageMetadata } from '@/lib/seo'

/**
 * noindex, absent from sitemap.xml, disallowed in robots.txt.
 *
 * Not an SEO sacrifice — student marks were never something we wanted in a
 * search index, and having them indexed would be a DPDP Act problem.
 *
 * This page used to take a roll number alone and return the marksheet. It now
 * goes through the student session like /student/ does. Keeping the old
 * unauthenticated lookup alongside the new login would have left two doors
 * into the same personal data with only one of them locked, so the login would
 * have secured nothing — and the marksheet now carries the candidate's date of
 * birth, both parents' names and photograph, which raises the cost of getting
 * that wrong.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Examination Results',
  description: 'Students can view published examination results after signing in.',
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
      intro="Sign in with your roll number and date of birth to view a published result."
    >
      <StudentPortal />
    </PageShell>
  )
}
