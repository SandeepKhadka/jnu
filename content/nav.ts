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
      { label: 'Affiliations', href: '/affiliations/' },
      { label: 'Achievers', href: '/about/achievers/' },
      { label: 'Community Programme', href: '/about/community-programme/' },
    ],
  },
  {
    label: 'Programmes',
    href: '/programmes/',
    children: [
      { label: 'Faculty of Commerce and Management', href: '/programmes/commerce-management/' },
      { label: 'Faculty of Arts and Social Science', href: '/programmes/arts-social-science/' },
      { label: 'Faculty of Agriculture Science', href: '/programmes/agriculture-science/' },
      { label: 'Faculty of Animation', href: '/programmes/animation/' },
      { label: 'Faculty of Computer Application', href: '/programmes/computer-application/' },
      { label: 'Faculty of Engineering and Technology', href: '/programmes/engineering-technology/' },
      { label: 'Faculty of Hotel Management', href: '/programmes/hotel-management/' },
      { label: 'Faculty of Journalism and Mass Communication', href: '/programmes/journalism-mass-communication/' },
      { label: 'Faculty of Law', href: '/programmes/law/' },
      { label: 'Faculty of Library and Information Science', href: '/programmes/library-information-science/' },
      { label: 'Faculty of Allied and Healthcare Sciences', href: '/programmes/allied-healthcare-sciences/' },
      { label: 'Faculty of Pharmacy', href: '/programmes/pharmacy/' },
      { label: 'Faculty of Physiotherapy', href: '/programmes/physiotherapy/' },
      { label: 'Faculty of Science', href: '/programmes/science/' },
      { label: 'Faculty of Education', href: '/programmes/education/' },
      { label: 'Faculty of Nursing', href: '/programmes/nursing/' },
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
      { label: 'Student Login', href: '/student/login/' },
      { label: 'Results', href: '/results/', noindex: true },
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
export const NOINDEX_ROUTES = ['/results/', '/admin/', '/admin/login/', '/student/'] as const
