/**
 * Single source of truth for branding, contact details and SEO defaults.
 * Everything institution-specific lives here so it can be swapped in one edit.
 */

export const site = {
  name: 'Jodhpur National University',
  shortName: 'JNU Jodhpur',
  legalName: 'Jodhpur National University, Jodhpur',
  tagline: 'Knowledge · Character · Service',

  // Used for canonicals, sitemap, OG. Override with NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jodhpurnationaluniversity.co.in',

  // Kept close to the original so search intent still matches, but trimmed to
  // a length that will not be truncated in the SERP (~60 chars).
  defaultTitle: 'Jodhpur National University, Jodhpur',
  titleTemplate: '%s | Jodhpur National University',
  defaultDescription:
    'Jodhpur National University, Jodhpur — programmes in engineering, management, ' +
    'pharmacy, computer applications, law, education, arts and commerce.',

  locale: 'en_IN',
  lang: 'en-IN',

  campus: {
    label: 'College Campus',
    lines: ['Jhanwar Road, Boranada', 'Jodhpur, Rajasthan', 'India'],
  },
  admissionOffice: {
    label: 'Administrative Office',
    lines: ['A-301, Anchal Complex', 'Residency Road', 'Jodhpur 342003, Rajasthan, India'],
  },

  email: 'info@jodhpurnationaluniversity.co.in',
  phone: '',

  social: {
    facebook: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    instagram: '',
  },

  established: '2008',

  /**
   * Shown in the footer and on the accreditation page.
   * IMPORTANT: leave blank until the registrar supplies current, dated evidence.
   * Never publish a recognition claim that cannot be evidenced on request.
   */
  recognition: {
    ugcStatus: '',
    approvals: [] as string[],
    lastVerified: '',
  },
} as const

export type Site = typeof site
