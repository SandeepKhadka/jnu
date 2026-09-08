import type { Metadata } from 'next'
import { AdminGate } from '@/components/admin/AdminGate'
import { AdminTabs } from '@/components/admin/AdminTabs'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Administration',
  description: 'University administration panel.',
  path: '/admin/',
  noindex: true,
})

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminTabs />
    </AdminGate>
  )
}
