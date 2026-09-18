import { CertificateRecords } from '@/components/admin/CertificateRecords'
import { PageHeader } from '@/components/admin/ui'

export default function Page() {
  return (
    <div>
      <PageHeader title="Degrees" description="Issue a degree to a student on the register, print it onto university stationery, and revoke it if necessary." />
      <CertificateRecords />
    </div>
  )
}
