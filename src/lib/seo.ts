import type { Metadata } from 'next'
import { site } from '@/content/site'
import { faculties, type Programme } from '@/content/programmes'

/**
 * Every page builds its metadata through here, so canonical URLs, OG tags and
 * robots directives can never drift apart. The original site's single biggest
 * SEO defect was a *relative* canonical (`rel=canonical="index.html"`), which
 * made every URL self-canonicalise ambiguously. `absoluteUrl` prevents that
 * class of bug entirely.
 */

export function absoluteUrl(path = '/'): string {
  const base = site.url.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

type PageMetaInput = {
  title: string
  description: string
  path: string
  /** Private routes: results, admin. Keeps student data out of the index. */
  noindex?: boolean
  ogImage?: string
  type?: 'website' | 'article'
  publishedTime?: string
}

export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  ogImage = '/og/default.png',
  type = 'website',
  publishedTime,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path)

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: site.name,
      title,
      description,
      locale: site.locale,
      images: [{ url: absoluteUrl(ogImage), width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(ogImage)],
    },
  }
}

/* ---------------------------------------------------------------- schema */

/**
 * EducationalOrganization — the single highest-value schema type for a
 * university, and entirely absent from the original site (which shipped only
 * a bare `WebSite` node with an http:// URL).
 */
export function organizationSchema() {
  const hasApprovals = site.recognition.approvals.length > 0

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': absoluteUrl('/#organization'),
    name: site.name,
    legalName: site.legalName,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/images/logo.png'),
    email: site.email,
    ...(site.phone ? { telephone: site.phone } : {}),
    foundingDate: site.established,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.campus.lines[0],
      addressLocality: 'Jodhpur',
      addressRegion: 'Rajasthan',
      addressCountry: 'IN',
    },
    // Only ever emitted when the registrar has supplied evidence.
    ...(hasApprovals ? { accreditedBy: site.recognition.approvals.map((n) => ({ '@type': 'Organization', name: n })) } : {}),
    sameAs: Object.values(site.social).filter(Boolean),
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    url: absoluteUrl('/'),
    name: site.name,
    inLanguage: site.lang,
    publisher: { '@id': absoluteUrl('/#organization') },
  }
}

/** Course schema per programme — drives eligibility-rich SERP results. */
export function courseSchema(p: Programme) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: p.name,
    description: `${p.name} (${p.award}) at ${site.name}. ${p.eligibility}.`,
    provider: { '@id': absoluteUrl('/#organization') },
    educationalCredentialAwarded: p.award,
    inLanguage: site.lang,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: p.mode === 'Full-time' ? 'onsite' : 'blended',
      courseWorkload: `P${p.durationMonths}M`,
    },
  }
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.path),
    })),
  }
}

export function faqSchema(qas: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/** Every indexable route, used to generate sitemap.xml. */
export function indexableRoutes(): string[] {
  const staticRoutes = [
    '/',
    '/about/',
    '/about/foundation/',
    '/about/chairperson-message/',
    '/about/infrastructure/',
    '/about/academic-council/',
    '/about/accreditation/',
    '/about/achievers/',
    '/about/community-programme/',
    '/faculty/',
    '/admission/',
    '/admission/process/',
    '/admission/eligibility/',
    '/admission/fee-structure/',
    '/admission/syllabus/',
    '/admission/download-forms/',
    '/research/',
    '/placement/',
    '/student-zone/',
    '/student-zone/time-table/',
    '/student-zone/enrollment-status/',
    '/student-zone/placement-notices/',
    '/student-zone/downloads/',
    '/notices/',
    '/verify/',
    '/photo-tour/',
    '/career/',
    '/contact/',
  ]

  const facultyRoutes = faculties.map((f) => `/faculty/${f.slug}/`)

  return [...staticRoutes, ...facultyRoutes]
}
