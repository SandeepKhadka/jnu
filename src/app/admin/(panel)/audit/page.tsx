import { AuditLog } from '@/components/admin/AuditLog'
import { PageHeader } from '@/components/admin/ui'

export default function Page() {
  return (
    <div>
      <PageHeader title="Audit log" description="Every change to results, degrees, student records and settings, with who made it." />
      <AuditLog />
    </div>
  )
}
