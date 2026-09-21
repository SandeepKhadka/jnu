import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/admin/LoginForm'
import { getSessionUser } from '@/lib/auth'
import { getBranding, getSite } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Staff sign in',
  robots: { index: false, follow: false, nocache: true },
}

export default async function LoginPage() {
  // Already signed in: go straight to the panel rather than showing a form
  // that would bounce them there anyway.
  if (await getSessionUser()) redirect('/admin')

  const [site, branding] = await Promise.all([getSite(), getBranding()])

  return (
    <div className="grid min-h-screen place-items-center bg-shell p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={branding.logo.src}
            srcSet={branding.logo.srcSet}
            sizes="230px"
            alt={site.name}
            width={branding.logo.width}
            height={branding.logo.height}
            className="mx-auto h-12 w-auto"
          />
        </Link>

        {/*
          No setup hint here. The page is public, and telling a visitor that
          the system has no administrator yet — and naming the command that
          creates one — is information only staff need. Setup instructions
          live in the README.
        */}
        <LoginForm />

        <p className="mt-4 text-center text-[12px] text-muted">
          <Link href="/" className="text-jnu-700">
            Return to the website
          </Link>
        </p>
      </div>
    </div>
  )
}
