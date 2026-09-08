import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/LoginForm'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Staff Login',
  description: 'Staff access to the university administration panel.',
  path: '/admin/login/',
  noindex: true,
})

export default function LoginPage() {
  return (
    <div className="boxed py-12">
      <div className="mx-auto max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
