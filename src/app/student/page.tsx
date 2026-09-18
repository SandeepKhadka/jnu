import type { Metadata } from 'next'

import { PageShell } from '@/components/layout/PageShell'
import { StudentPortal } from '@/components/student/StudentPortal'
import { pageMetadata } from '@/lib/seo'

/**
 * noindex, and disallowed in robots.txt.
 *
 * Not an SEO sacrifice: this page shows a named student's date of birth, both
 * parents' names, photograph and marks. Indexing it would be a DPDP Act
 * problem, not a ranking opportunity.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Student Portal',
  description: 'Signed-in students can view their profile and published examination results.',
  path: '/student/',
  noindex: true,
})

export default function StudentPage() {
  return (
    <PageShell
      title="Student Portal"
      crumbs={[
        { name: 'Student Zone', path: '/student-zone/' },
        { name: 'Student Portal', path: '/student/' },
      ]}
      intro="Your candidate details and published examination results."
    >
      <StudentPortal />
    </PageShell>
  )
}
