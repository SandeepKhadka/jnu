/**
 * The admin sidebar's icons.
 *
 * Drawn inline rather than pulled from an icon package: there are twenty of
 * them, they never change, and a dependency would ship several hundred more
 * that this panel will never render. Each is a 24×24 stroked outline on the
 * same grid, so they sit together evenly at 18px.
 *
 * Icons here are decoration — every one sits beside its own text label, and
 * the label is what the reader actually navigates by. They are marked
 * aria-hidden so a screen reader announces the link once, not twice.
 */

export type IconName =
  | 'dashboard'
  | 'home'
  | 'carousel'
  | 'pages'
  | 'programmes'
  | 'notices'
  | 'gallery'
  | 'menu'
  | 'media'
  | 'students'
  | 'results'
  | 'degrees'
  | 'requests'
  | 'applications'
  | 'enquiries'
  | 'settings'
  | 'branding'
  | 'recognition'
  | 'examinations'
  | 'staff'
  | 'audit'
  | 'chevron'
  | 'external'
  | 'signout'

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  carousel: (
    <>
      <rect x="6" y="5" width="12" height="14" rx="2" />
      <path d="M3 8v8M21 8v8" />
    </>
  ),
  pages: (
    <>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M13 3v6h6" />
    </>
  ),
  programmes: (
    <>
      <path d="M12 4 2 9l10 5 10-5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  notices: (
    <>
      <path d="M4 9v6h3l6 4V5L7 9z" />
      <path d="M17 9.5a4 4 0 0 1 0 5" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-2.5L20 17" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </>
  ),
  media: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  students: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 14.6c2 .7 3.5 2.6 3.5 5.4" />
    </>
  ),
  results: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  degrees: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7" />
    </>
  ),
  requests: (
    <>
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
      <path d="M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
    </>
  ),
  applications: (
    <>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M13 3v6h6M9 13h6M9 17h4" />
    </>
  ),
  enquiries: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h7M15 17h5" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="13" cy="17" r="2" />
    </>
  ),
  branding: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8.5" cy="10" r="1.3" />
      <circle cx="15.5" cy="10" r="1.3" />
      <path d="M12 21c-1.5 0-2-1-2-2s1.5-1.5 1.5-3 1-2 2.5-2h3" />
    </>
  ),
  recognition: (
    <>
      <path d="M12 3l7 3v5.5c0 4.3-2.9 7.9-7 9.5-4.1-1.6-7-5.2-7-9.5V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  examinations: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  staff: (
    <>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.9-5.5 6.5-5.5 1.4 0 2.7.3 3.8.9" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M17.5 13.6v1M17.5 20.4v1M21.4 17.5h-1M14.6 17.5h-1" />
    </>
  ),
  audit: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </>
  ),
  signout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8 6 12l4 4M6 12h9" />
    </>
  ),
}

export function Icon({
  name,
  size = 18,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
