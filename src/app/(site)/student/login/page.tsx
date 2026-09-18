import type { Metadata } from 'next'

import { PageShell } from '@/components/layout/PageShell'
import { StudentPortal } from '@/components/student/StudentPortal'
import { pageMetadata } from '@/lib/seo'

/**
 * The login screen and the portal are the same component: it renders the form
 * when there is no session and the record when there is. That way a student
 * who is already signed in and follows a "Student Login" link sees their
 * record rather than a login form they do not need.
 */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Student Login',
    description: 'Students sign in with their roll number and date of birth.',
    path: '/student/login/',
    noindex: true,
  })
}

export default function StudentLoginPage() {
  return (
    <PageShell
      title="Student Login"
      crumbs={[
        { name: 'Student Zone', path: '/student-zone/' },
        { name: 'Student Login', path: '/student/login/' },
      ]}
      intro="Sign in with your roll number and date of birth."
    >
      <StudentPortal />
    </PageShell>
  )
}
