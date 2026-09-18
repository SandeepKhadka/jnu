import { ChangePassword } from '@/components/admin/ChangePassword'
import { PageHeader } from '@/components/admin/ui'
import { getSessionUser } from '@/lib/auth'
import { roleLabel } from '@/lib/permissions'

export default async function AccountPage() {
  const user = await getSessionUser()
  if (!user) return null
  return (
    <div className="max-w-xl">
      <PageHeader title="My account" description={`${user.fullName} · ${user.email} · ${roleLabel(user.role)}`} />
      <ChangePassword />
    </div>
  )
}
