import 'server-only'

import type { Metadata } from 'next'

import { getBranding, getFaculties, getPublishedPagePaths, getSetting, getSite } from '@/lib/content'
import type { ProgrammeDTO } from '@/lib/content-dto'
import { absoluteUrl, SITE_URL } from '@/lib/site-url'

export { absoluteUrl }

/**
 * Every page builds its metadata through here, so canonical URLs, OG tags and
 * robots directives can never drift apart. The original site's single biggest
 * SEO defect was a *relative* canonical (`rel=canonical="index.html"`), which
 * made every URL self-canonicalise ambiguously. `absoluteUrl` prevents that
 * class of bug entirely.
 *
 * Async because the site name and default share image are now edited in the
 * admin panel; pages call it from generateMetadata.
 */

type PageMetaInput = {
  title: string
  description: string
  path: string
  /** Private routes: results, admin. Keeps student data out of the index. */
  noindex?: boolean
  /** Path or absolute URL; defaults to the share image set in Branding. */
  ogImage?: string
  type?: 'website' | 'article'
  publishedTime?: string
}

export async function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  ogImage,
  type = 'website',
  publishedTime,
}: PageMetaInput): Promise<Metadata> {
  const [site, branding] = await Promise.all([getSite(), getBranding()])
  const url = absoluteUrl(path)
  const image = absoluteUrl(ogImage ?? branding.ogImage)

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false, nocache: true } : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: site.name,
      title,
      description,
      locale: 'en_IN',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

/* ---------------------------------------------------------------- schema */

/**
 * EducationalOrganization — the single highest-value schema type for a
 * university. Recognition appears ONLY when the registrar has recorded a
 * statement with its evidence (see Recognition in the admin panel).
 */
export async function organizationSchema() {
  const [site, branding, recognition] = await Promise.all([
    getSite(),
    getBranding(),
    getSetting('recognition'),
  ])
  const hasApprovals = recognition.approvals.length > 0 && Boolean(recognition.evidence)
  const sameAs = Object.values(site.social).filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': absoluteUrl('/#organization'),
    name: site.name,
    legalName: site.legalName,
    url: absoluteUrl('/'),
    logo: absoluteUrl(branding.logo.src),
    email: site.email,
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.established ? { foundingDate: site.established } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.campus.lines[0] ?? '',
      addressLocality: 'Jodhpur',
      addressRegion: 'Rajasthan',
      addressCountry: 'IN',
    },
    ...(hasApprovals
      ? { accreditedBy: recognition.approvals.map((n) => ({ '@type': 'Organization', name: n })) }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export async function websiteSchema() {
  const site = await getSite()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    url: absoluteUrl('/'),
    name: site.name,
    inLanguage: 'en-IN',
    publisher: { '@id': absoluteUrl('/#organization') },
  }
}

/** Course schema per programme — drives eligibility-rich SERP results. */
export function courseSchema(p: ProgrammeDTO, siteName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: p.name,
    description: `${p.name} (${p.award}) at ${siteName}. ${p.eligibility}.`,
    provider: { '@id': absoluteUrl('/#organization') },
    educationalCredentialAwarded: p.award,
    inLanguage: 'en-IN',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: p.mode === 'Full-time' ? 'onsite' : p.mode === 'Distance' ? 'online' : 'blended',
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

/** Routes that have their own page file rather than a CMS page. */
const FIXED_ROUTES = ['/', '/notices/', '/verify/', '/contact/']

/**
 * Every indexable route, for sitemap.xml: fixed routes, every published CMS
 * page, and every faculty that has at least one published programme (an
 * empty faculty is served noindex, so listing it would contradict itself).
 */
export async function indexableRoutes(): Promise<{ path: string; updatedAt?: string }[]> {
  const [pages, faculties] = await Promise.all([getPublishedPagePaths(), getFaculties()])
  const seen = new Set<string>()
  const out: { path: string; updatedAt?: string }[] = []
  const add = (path: string, updatedAt?: string) => {
    if (seen.has(path)) return
    seen.add(path)
    out.push({ path, updatedAt })
  }
  FIXED_ROUTES.forEach((p) => add(p))
  pages.forEach((p) => add(p.path, p.updatedAt))
  faculties.filter((f) => f.programmes.length > 0).forEach((f) => add(`/programmes/${f.slug}/`))
  return out
}

export { SITE_URL }
