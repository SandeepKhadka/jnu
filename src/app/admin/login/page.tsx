import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/admin/LoginForm'
import { db } from '@/lib/db'
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

  const [site, branding, staffCount] = await Promise.all([getSite(), getBranding(), db.staff.count()])

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

        {staffCount === 0 ? (
          <div className="mb-4 rounded border border-sand-500 bg-white p-4 text-[13px]">
            <p className="m-0 font-semibold text-jnu-800">No administrator account exists yet</p>
            <p className="m-0 mt-1 text-muted">
              Create the first one on the server, then sign in here:
            </p>
            <code className="mt-2 block overflow-x-auto rounded bg-shell px-2 py-1.5 text-[12px]">
              npm run admin:create -- --email you@university.in --name &quot;Your Name&quot;
            </code>
          </div>
        ) : null}

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
