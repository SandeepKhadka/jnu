import { ReviewQueue } from '@/components/admin/ReviewQueue'
import { PageHeader } from '@/components/admin/ui'

export default function Page() {
  return (
    <div>
      <PageHeader title="Student requests" description="Photographs students have uploaded, and requests to correct details they cannot change themselves." />
      <ReviewQueue />
    </div>
  )
}
