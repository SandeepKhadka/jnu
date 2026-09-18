import { ResultsManager } from '@/components/admin/ResultsManager'
import { PageHeader } from '@/components/admin/ui'

export default function Page() {
  return (
    <div>
      <PageHeader title="Examination results" description="Add results one at a time or import a whole cohort, then publish them. Students see only published results." />
      <ResultsManager />
    </div>
  )
}
