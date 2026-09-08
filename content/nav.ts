/**
 * Navigation tree, mirroring the structure crawled from the original site.
 * `noindex` marks routes that must stay out of the sitemap and carry a
 * robots noindex tag — private data, never public content.
 */

export type NavItem = {
  label: string
  href: string
  children?: NavItem[]
  noindex?: boolean
}

export const nav: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'JNU',
    href: '/about/',
    children: [
      { label: 'Foundation', href: '/about/foundation/' },
      { label: "Chairperson's Message", href: '/about/chairperson-message/' },
      { label: 'Infrastructure', href: '/about/infrastructure/' },
      { label: 'Academic Council', href: '/about/academic-council/' },
      { label: 'Accreditation & Approvals', href: '/about/accreditation/' },
      { label: 'Achievers', href: '/about/achievers/' },
      { label: 'Community Programme', href: '/about/community-programme/' },
    ],
  },
  {
    label: 'Faculty',
    href: '/faculty/',
    children: [
      { label: 'Engineering & Technology', href: '/faculty/engineering-technology/' },
      { label: 'Management', href: '/faculty/management/' },
      { label: 'Pharmaceutical Sciences', href: '/faculty/pharmaceutical-sciences/' },
      { label: 'Computer Application', href: '/faculty/computer-application/' },
      { label: 'Applied Sciences & Nursing', href: '/faculty/applied-sciences-nursing/' },
      { label: 'Law', href: '/faculty/law/' },
      { label: 'Education', href: '/faculty/education/' },
      { label: 'Arts & Commerce', href: '/faculty/arts-commerce/' },
    ],
  },
  {
    label: 'Admission',
    href: '/admission/',
    children: [
      { label: 'Admission Process', href: '/admission/process/' },
      { label: 'Eligibility', href: '/admission/eligibility/' },
      { label: 'Fee Structure', href: '/admission/fee-structure/' },
      { label: 'Syllabus', href: '/admission/syllabus/' },
      { label: 'Download Forms', href: '/admission/download-forms/' },
    ],
  },
  { label: 'Research', href: '/research/' },
  { label: 'Placement', href: '/placement/' },
  {
    label: 'Student Zone',
    href: '/student-zone/',
    children: [
      { label: 'Notices & Circulars', href: '/notices/' },
      { label: 'Examination Results', href: '/results/', noindex: true },
      { label: 'Certificate Verification', href: '/verify/' },
      { label: 'Time Table', href: '/student-zone/time-table/' },
      { label: 'Enrollment Status', href: '/student-zone/enrollment-status/' },
      { label: 'Placement Notices', href: '/student-zone/placement-notices/' },
      { label: 'Downloads', href: '/student-zone/downloads/' },
    ],
  },
  { label: 'Photo Tour', href: '/photo-tour/' },
  { label: 'Career', href: '/career/' },
  { label: 'Contact', href: '/contact/' },
]

/** Footer quick links — the highest-intent pages, as on the original. */
export const quickLinks: NavItem[] = [
  { label: 'Admission Process', href: '/admission/process/' },
  { label: 'Fee Structure', href: '/admission/fee-structure/' },
  { label: 'Notices & Circulars', href: '/notices/' },
  { label: 'Examination Results', href: '/results/' },
  { label: 'Certificate Verification', href: '/verify/' },
  { label: 'Download Forms', href: '/admission/download-forms/' },
  { label: 'Time Table', href: '/student-zone/time-table/' },
  { label: 'Contact', href: '/contact/' },
]

/** Routes excluded from sitemap.xml and served with noindex. */
export const NOINDEX_ROUTES = ['/results/', '/admin/', '/admin/login/'] as const
