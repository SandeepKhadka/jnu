import { redirect } from 'next/navigation'

import { AdminShell } from '@/components/admin/AdminShell'
import { ChangePassword } from '@/components/admin/ChangePassword'
import { getSessionUser } from '@/lib/auth'

/**
 * The gate for everything under /admin.
 *
 * Checked on the SERVER before any admin screen renders, so an unauthenticated
 * request receives a redirect rather than a page that then hides itself. Every
 * API route checks again — this is convenience, not the boundary.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/admin/login/')

  // An account on a temporary password gets one screen until it is replaced;
  // the API refuses everything else for it anyway.
  if (user.mustChangePassword) {
    return (
      <AdminShell user={user}>
        <div className="mx-auto max-w-xl">
          <ChangePassword forced />
        </div>
      </AdminShell>
    )
  }

  return <AdminShell user={user}>{children}</AdminShell>
}
