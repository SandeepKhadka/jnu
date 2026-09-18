import type { Metadata } from 'next'

/**
 * Admin chrome is entirely separate from the public site: no header, footer,
 * nav or sitewide schema. The session check lives in (panel)/layout.tsx so
 * that the sign-in page, which sits outside that group, stays reachable.
 */
export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
