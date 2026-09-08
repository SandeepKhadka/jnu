/**
 * Notices are BUILD-TIME content, deliberately.
 *
 * They are public content we want indexed, so they must land in static HTML.
 * If the admin panel wrote these to Supabase and the page fetched them in the
 * browser, Google would frequently fail to index them — throwing away exactly
 * the SEO this project exists to deliver.
 *
 * Flow: editor saves in /admin -> writes here via the git-backed CMS (or a
 * commit) -> deploy hook rebuilds -> notice is live in HTML in ~90 seconds.
 * See README, "Publishing notices".
 */

export type Notice = {
  id: string
  date: string // ISO 8601 — drives <time> and Article schema
  title: string
  category: 'Examination' | 'Admission' | 'General' | 'Placement' | 'Result'
  href?: string // internal page
  file?: string // PDF in /public/documents
  pinned?: boolean
}

export const notices: Notice[] = [
  {
    id: 'n-2026-09-01',
    date: '2026-09-01',
    title: 'Academic calendar for the 2026–27 session',
    category: 'General',
    file: '/documents/academic-calendar-2026-27.pdf',
    pinned: true,
  },
  {
    id: 'n-2026-08-22',
    date: '2026-08-22',
    title: 'Examination form submission dates — odd semester 2026–27',
    category: 'Examination',
    file: '/documents/exam-form-odd-semester-2026-27.pdf',
  },
  {
    id: 'n-2026-08-14',
    date: '2026-08-14',
    title: 'Revised fee structure notification',
    category: 'Admission',
    href: '/admission/fee-structure/',
  },
  {
    id: 'n-2026-08-02',
    date: '2026-08-02',
    title: 'Campus placement drive — registration open',
    category: 'Placement',
    href: '/student-zone/placement-notices/',
  },
  {
    id: 'n-2026-07-19',
    date: '2026-07-19',
    title: 'Library timings during the vacation period',
    category: 'General',
  },
  {
    id: 'n-2026-07-05',
    date: '2026-07-05',
    title: 'Instructions for re-evaluation applications',
    category: 'Examination',
    file: '/documents/re-evaluation-instructions.pdf',
  },
]

/** Notices sorted newest first, pinned entries hoisted to the top. */
export const sortedNotices: Notice[] = [...notices].sort((a, b) => {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
  return b.date.localeCompare(a.date)
})

export function formatNoticeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
