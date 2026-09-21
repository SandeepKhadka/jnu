/**
 * Shapes, defaults and validation for everything the admin panel edits.
 *
 * Client-safe (no server imports): the admin forms use these types and
 * defaults, and the API routes run every incoming value through the same
 * `normalise*` functions before it is stored. A malformed or hostile request
 * can therefore only ever store a well-formed value — unknown keys dropped,
 * lengths capped, URLs restricted to safe schemes.
 *
 * The DEFAULT_* values are the site's content at the moment the CMS was
 * introduced; they seed an empty database and fill any gap in a stored value.
 */

/* ============================================================ primitives */

function str(v: unknown, max = 500, fallback = ''): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : fallback
}

function strList(v: unknown, maxItems = 50, maxLen = 500): string[] {
  return Array.isArray(v)
    ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems)
    : []
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

/**
 * Internal paths, https/mailto/tel links and nothing else. A `javascript:`
 * href saved into the menu would otherwise run on every page of the site.
 */
export function safeHref(v: unknown): string {
  const s = str(v, 400)
  if (!s) return ''
  if (s.startsWith('/') && !s.startsWith('//')) return s
  if (/^(https:\/\/|mailto:|tel:)/i.test(s)) return s
  return ''
}

export function safeId(v: unknown): string | null {
  const s = str(v, 40)
  return /^[a-z0-9]{10,40}$/i.test(s) ? s : null
}

/** `/about/foundation/` — leading and trailing slash, lowercase, safe chars. */
export function normalisePath(v: unknown): string | null {
  let s = str(v, 200).toLowerCase()
  if (!s) return null
  if (!s.startsWith('/')) s = `/${s}`
  if (!s.endsWith('/')) s = `${s}/`
  if (!/^\/([a-z0-9-]+\/)+$/.test(s)) return null
  return s
}

export function slugify(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/* ================================================================ blocks */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  // Reader notes render; maintainer notes are internal to-dos, hidden unless
  // NEXT_PUBLIC_SHOW_MAINTAINER_NOTES is on.
  | { type: 'note'; text: string; audience?: 'reader' | 'maintainer' }

export type BlockType = Block['type']

export const BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: 'h2', label: 'Heading' },
  { type: 'h3', label: 'Sub-heading' },
  { type: 'p', label: 'Paragraph' },
  { type: 'ul', label: 'Bulleted list' },
  { type: 'ol', label: 'Numbered list' },
  { type: 'table', label: 'Table' },
  { type: 'note', label: 'Note box' },
]

/** Blocks are typed data, never HTML — an editor cannot inject markup. */
export function normaliseBlocks(v: unknown): Block[] {
  if (!Array.isArray(v)) return []
  const out: Block[] = []
  for (const raw of v.slice(0, 300)) {
    const b = obj(raw)
    switch (b.type) {
      case 'p':
      case 'h2':
      case 'h3': {
        const text = str(b.text, 5000)
        if (text) out.push({ type: b.type, text })
        break
      }
      case 'ul':
      case 'ol': {
        const items = strList(b.items, 100, 1000)
        if (items.length) out.push({ type: b.type, items })
        break
      }
      case 'table': {
        const head = strList(b.head, 12, 200)
        const rows = Array.isArray(b.rows)
          ? b.rows
              .slice(0, 200)
              .map((r) => (Array.isArray(r) ? r.slice(0, 12).map((c) => str(c, 1000)) : []))
              .filter((r) => r.some(Boolean))
          : []
        if (head.length || rows.length) out.push({ type: 'table', head, rows })
        break
      }
      case 'note': {
        const text = str(b.text, 3000)
        if (text) {
          out.push({
            type: 'note',
            text,
            audience: b.audience === 'maintainer' ? 'maintainer' : 'reader',
          })
        }
        break
      }
    }
  }
  return out
}

export type Crumb = { name: string; path: string }

export function normaliseCrumbs(v: unknown): Crumb[] {
  if (!Array.isArray(v)) return []
  return v
    .slice(0, 8)
    .map((c) => ({ name: str(obj(c).name, 80), path: normalisePath(obj(c).path) ?? '' }))
    .filter((c) => c.name && c.path)
}

/* ================================================================== site */

export type SiteSettings = {
  name: string
  shortName: string
  legalName: string
  tagline: string
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  email: string
  phone: string
  verificationEmail: string
  established: string
  campus: { label: string; lines: string[] }
  admissionOffice: { label: string; lines: string[] }
  social: { facebook: string; twitter: string; linkedin: string; youtube: string; instagram: string }
}

export const DEFAULT_SITE: SiteSettings = {
  name: 'Jodhpur National University',
  shortName: 'JNU Jodhpur',
  legalName: 'Jodhpur National University, Jodhpur',
  tagline: 'Knowledge · Character · Service',
  defaultTitle: 'Jodhpur National University, Jodhpur',
  titleTemplate: '%s | Jodhpur National University',
  defaultDescription:
    'Jodhpur National University, Jodhpur — programmes in engineering, management, ' +
    'pharmacy, computer applications, law, education, sciences, arts and allied health.',
  email: 'info@jodhpurnationaluniversity.co.in',
  phone: '',
  verificationEmail: 'jnuverification@gmail.com',
  established: '2008',
  campus: { label: 'College Campus', lines: ['Jhanwar Road, Boranada', 'Jodhpur, Rajasthan', 'India'] },
  admissionOffice: {
    label: 'Administrative Office',
    lines: ['A-301, Anchal Complex', 'Residency Road', 'Jodhpur 342003, Rajasthan, India'],
  },
  social: { facebook: '', twitter: '', linkedin: '', youtube: '', instagram: '' },
}

function email(v: unknown, fallback: string): string {
  const s = str(v, 160)
  if (!s) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : fallback
}

export function normaliseSite(v: unknown): SiteSettings {
  const o = obj(v)
  const d = DEFAULT_SITE
  const block = (x: unknown, fb: SiteSettings['campus']) => ({
    label: str(obj(x).label, 80) || fb.label,
    lines: strList(obj(x).lines, 6, 120),
  })
  const social = obj(o.social)
  const url = (x: unknown) => (/^https:\/\//i.test(str(x, 300)) ? str(x, 300) : '')
  const template = str(o.titleTemplate, 120)
  return {
    name: str(o.name, 120) || d.name,
    shortName: str(o.shortName, 60) || d.shortName,
    legalName: str(o.legalName, 160) || d.legalName,
    tagline: str(o.tagline, 160),
    defaultTitle: str(o.defaultTitle, 70) || d.defaultTitle,
    // The template must contain %s, or every page would get the same title.
    titleTemplate: template.includes('%s') ? template : d.titleTemplate,
    defaultDescription: str(o.defaultDescription, 300) || d.defaultDescription,
    email: email(o.email, d.email),
    phone: str(o.phone, 40),
    verificationEmail: email(o.verificationEmail, d.verificationEmail),
    established: str(o.established, 10),
    campus: block(o.campus, d.campus),
    admissionOffice: block(o.admissionOffice, d.admissionOffice),
    social: {
      facebook: url(social.facebook),
      twitter: url(social.twitter),
      linkedin: url(social.linkedin),
      youtube: url(social.youtube),
      instagram: url(social.instagram),
    },
  }
}

/* ============================================================== branding */

/** Media ids. null falls back to the files shipped in public/images/brand/. */
export type Branding = {
  logoId: string | null
  crestId: string | null
  ogImageId: string | null
}

export const DEFAULT_BRANDING: Branding = { logoId: null, crestId: null, ogImageId: null }

export function normaliseBranding(v: unknown): Branding {
  const o = obj(v)
  return { logoId: safeId(o.logoId), crestId: safeId(o.crestId), ogImageId: safeId(o.ogImageId) }
}

/** Resolved for rendering: always usable URLs. */
export type ResolvedBranding = {
  logo: { src: string; srcSet?: string; width: number; height: number }
  crest: string
  ogImage: string
}

export const FALLBACK_BRANDING: ResolvedBranding = {
  logo: {
    src: '/images/brand/jnu-logo-lockup.png',
    srcSet: '/images/brand/jnu-logo-lockup.png 317w, /images/brand/jnu-logo-lockup@2x.png 634w',
    width: 317,
    height: 78,
  },
  crest: '/images/brand/jnu-crest.png',
  ogImage: '/og/default.jpg',
}

/* ================================================================== home */

export type LinkButton = { label: string; href: string }
export type QuickCard = { label: string; href: string; icon: string; text: string }
export type Faq = { q: string; a: string }

export type HomeContent = {
  heroEyebrow: string
  heroHeadline: string
  heroBody: string
  primaryCta: LinkButton
  secondaryCta: LinkButton
  quickCards: QuickCard[]
  aboutTitle: string
  aboutParagraphs: string[]
  faqs: Faq[]
}

export const DEFAULT_HOME: HomeContent = {
  heroEyebrow: 'Jodhpur National University',
  heroHeadline: 'Professional and technical education in Jodhpur',
  heroBody:
    'Programmes in engineering, management, pharmacy, computer applications, law, education, sciences, the arts and allied health.',
  primaryCta: { label: 'Browse Programmes', href: '/programmes/' },
  secondaryCta: { label: 'Apply Online', href: '/admission/process/' },
  quickCards: [
    { label: 'Admission Process', href: '/admission/process/', icon: '✎', text: 'Eligibility, dates and how to apply.' },
    { label: 'Fee Structure', href: '/admission/fee-structure/', icon: '₹', text: 'Programme-wise fees and payment schedule.' },
    { label: 'Examination Results', href: '/results/', icon: '◈', text: 'Sign in to view your published results.' },
    { label: 'Certificate Verification', href: '/verify/', icon: '✓', text: 'Employers and institutions can verify a certificate.' },
  ],
  aboutTitle: 'About the University',
  aboutParagraphs: [
    'Jodhpur National University offers professional and technical education from its campus on Jhanwar Road, Boranada, Jodhpur. Teaching is organised through departmental laboratories, workshops, a central library and a computing facility.',
    'Programmes span undergraduate, postgraduate and doctoral levels, with a curriculum structured around semester examinations and continuous internal assessment. Each faculty page lists its programmes with duration, award and eligibility.',
  ],
  faqs: [
    {
      q: 'Which programmes does Jodhpur National University offer?',
      a: 'Programmes are offered across the faculties listed under Programmes, including engineering and technology, commerce and management, pharmacy, computer application, law, education and the sciences.',
    },
    {
      q: 'Where is the university located?',
      a: 'The campus is on Jhanwar Road, Boranada, Jodhpur, Rajasthan. The administrative office is at A-301, Anchal Complex, Residency Road, Jodhpur 342003.',
    },
    {
      q: 'How do I check my examination results?',
      a: 'Sign in to the Student Portal with your roll number and date of birth. Results appear once the examination cell has published them.',
    },
    {
      q: 'How can an employer verify a certificate?',
      a: 'Use the Certificate Verification page, or scan the QR code printed on the degree. Certificates not present in the register are reported as not verified.',
    },
  ],
}

export function normaliseHome(v: unknown): HomeContent {
  const o = obj(v)
  const d = DEFAULT_HOME
  const btn = (x: unknown, fb: LinkButton): LinkButton => ({
    label: str(obj(x).label, 40) || fb.label,
    href: safeHref(obj(x).href) || fb.href,
  })
  const cards = Array.isArray(o.quickCards)
    ? o.quickCards
        .slice(0, 8)
        .map((c) => ({
          label: str(obj(c).label, 60),
          href: safeHref(obj(c).href),
          icon: str(obj(c).icon, 4),
          text: str(obj(c).text, 160),
        }))
        .filter((c) => c.label && c.href)
    : d.quickCards
  const faqs = Array.isArray(o.faqs)
    ? o.faqs
        .slice(0, 20)
        .map((f) => ({ q: str(obj(f).q, 200), a: str(obj(f).a, 1500) }))
        .filter((f) => f.q && f.a)
    : d.faqs
  return {
    heroEyebrow: str(o.heroEyebrow, 80),
    heroHeadline: str(o.heroHeadline, 120) || d.heroHeadline,
    heroBody: str(o.heroBody, 400),
    primaryCta: btn(o.primaryCta, d.primaryCta),
    secondaryCta: btn(o.secondaryCta, d.secondaryCta),
    quickCards: cards,
    aboutTitle: str(o.aboutTitle, 80) || d.aboutTitle,
    aboutParagraphs: Array.isArray(o.aboutParagraphs) ? strList(o.aboutParagraphs, 6, 1500) : d.aboutParagraphs,
    faqs,
  }
}

/* ================================================================== menu */

export type MenuItem = {
  label: string
  href: string
  /** 'faculties': children are generated from the published faculties. */
  auto?: 'faculties'
  children?: MenuItem[]
}

export const DEFAULT_MENU: MenuItem[] = [
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
  { label: 'Programmes', href: '/programmes/', auto: 'faculties' },
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
      { label: 'Examination Results', href: '/results/' },
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

function menuItems(v: unknown, depth: number): MenuItem[] {
  if (!Array.isArray(v)) return []
  const out: MenuItem[] = []
  for (const raw of v.slice(0, 30)) {
    const o = obj(raw)
    const label = str(o.label, 60)
    const href = safeHref(o.href)
    if (!label || !href) continue
    const item: MenuItem = { label, href }
    if (depth === 0 && o.auto === 'faculties') item.auto = 'faculties'
    else if (depth === 0) {
      const children = menuItems(o.children, 1)
      if (children.length) item.children = children
    }
    out.push(item)
  }
  return out
}

/** Two levels only — the header design has no third tier. */
export function normaliseMenu(v: unknown): MenuItem[] {
  return menuItems(v, 0)
}

export type FooterLink = { label: string; href: string }

export const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { label: 'Admission Process', href: '/admission/process/' },
  { label: 'Fee Structure', href: '/admission/fee-structure/' },
  { label: 'Notices & Circulars', href: '/notices/' },
  { label: 'Examination Results', href: '/results/' },
  { label: 'Certificate Verification', href: '/verify/' },
  { label: 'Download Forms', href: '/admission/download-forms/' },
  { label: 'Photo Tour', href: '/photo-tour/' },
  { label: 'Contact', href: '/contact/' },
]

export function normaliseFooterLinks(v: unknown): FooterLink[] {
  return menuItems(v, 1).map(({ label, href }) => ({ label, href }))
}

/* ========================================================= popup notice */

/**
 * The announcement shown over the home page on arrival.
 *
 * Typed fields, not markup: `body` is plain text and every link goes through
 * safeHref, so an editor filling this in cannot inject a script or a
 * `javascript:` URL into the first thing every visitor sees.
 */
export type PopupNotice = {
  enabled: boolean
  title: string
  body: string
  links: FooterLink[]
  /** Bumped by the editor to show a dismissed notice again. */
  revision: number
}

export const DEFAULT_POPUP_NOTICE: PopupNotice = {
  enabled: false,
  title: '',
  body: '',
  links: [],
  revision: 1,
}

export function normalisePopupNotice(v: unknown): PopupNotice {
  const o = obj(v)
  const revision = Number(o.revision)
  return {
    enabled: o.enabled === true,
    title: str(o.title, 160),
    body: str(o.body, 2000),
    links: menuItems(o.links, 1)
      .slice(0, 6)
      .map(({ label, href }) => ({ label, href })),
    revision: Number.isFinite(revision) && revision > 0 ? Math.floor(revision) : 1,
  }
}

/* ===================================================== document listings */

/**
 * A list of documents the public may open — affiliations and syllabus.
 *
 * Both pages are the same shape (a titled row, a note, and a PDF), so they
 * share one type, one normaliser and one editor. `documentId` points at a
 * Media row, which is how every other admin-uploaded file is referenced.
 */
export type DocumentRow = {
  title: string
  note: string
  documentId: string | null
}

export type DocumentList = {
  intro: string
  rows: DocumentRow[]
}

export const DEFAULT_DOCUMENT_LIST: DocumentList = { intro: '', rows: [] }

export function normaliseDocumentList(v: unknown): DocumentList {
  const o = obj(v)
  const rows = Array.isArray(o.rows) ? o.rows.slice(0, 200) : []
  return {
    intro: str(o.intro, 1000),
    rows: rows
      .map((raw) => {
        const r = obj(raw)
        return {
          title: str(r.title, 200),
          note: str(r.note, 500),
          documentId: safeId(r.documentId),
        }
      })
      .filter((r) => r.title),
  }
}

/* =========================================================== recognition */

/**
 * Printed in the footer, the accreditation page and on statements of marks.
 * `evidence` and `lastVerified` are REQUIRED whenever any claim is present —
 * the server refuses a claim without them (see normaliseRecognition's caller).
 */
export type Recognition = {
  ugcStatus: string
  approvals: string[]
  /** YYYY-MM-DD the evidence was last checked. */
  lastVerified: string
  /** Reference to the document on file, e.g. "UGC letter F.8-12/2008(CPP-I) dated …". */
  evidence: string
}

export const DEFAULT_RECOGNITION: Recognition = {
  ugcStatus: '',
  approvals: [],
  lastVerified: '',
  evidence: '',
}

export function normaliseRecognition(v: unknown): Recognition {
  const o = obj(v)
  const date = str(o.lastVerified, 10)
  return {
    ugcStatus: str(o.ugcStatus, 300),
    approvals: strList(o.approvals, 12, 200),
    lastVerified: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    evidence: str(o.evidence, 500),
  }
}

export function recognitionProblem(r: Recognition): string | null {
  const claims = Boolean(r.ugcStatus) || r.approvals.length > 0
  if (!claims) return null
  if (!r.evidence) return 'Record the evidence document reference before publishing a recognition statement.'
  if (!r.lastVerified) return 'Record the date the evidence was last verified.'
  return null
}

/* ========================================================== examinations */

export type Examinations = {
  controllerTitle: string
  /** Media id of the Controller's scanned signature, or null. */
  signatureId: string | null
  place: string
  centre: string
}

export const DEFAULT_EXAMINATIONS: Examinations = {
  controllerTitle: 'Controller of Examinations',
  signatureId: null,
  place: 'Jodhpur, Rajasthan',
  centre: 'Main Campus',
}

export function normaliseExaminations(v: unknown): Examinations {
  const o = obj(v)
  const d = DEFAULT_EXAMINATIONS
  return {
    controllerTitle: str(o.controllerTitle, 80) || d.controllerTitle,
    signatureId: safeId(o.signatureId),
    place: str(o.place, 80) || d.place,
    centre: str(o.centre, 80) || d.centre,
  }
}

/* ==================================================== certificate layout */

export type Align = 'left' | 'center' | 'right'

export type FieldBox = {
  x: number
  y: number
  w: number
  align: Align
  size: number
  bold?: boolean
  italic?: boolean
  caps?: boolean
  prefix?: string
}

export type StationeryField =
  | 'studentName'
  | 'programme'
  | 'division'
  | 'awardYear'
  | 'certificateNo'
  | 'enrollmentNo'
  | 'issuedOn'
  | 'serial'

export const STATIONERY_FIELDS: { id: StationeryField; label: string }[] = [
  { id: 'studentName', label: 'Student name' },
  { id: 'programme', label: 'Degree / programme' },
  { id: 'division', label: 'Division' },
  { id: 'awardYear', label: 'Year' },
  { id: 'certificateNo', label: 'Certificate no.' },
  { id: 'enrollmentNo', label: 'Enrollment no.' },
  { id: 'issuedOn', label: 'Date of issue' },
  { id: 'serial', label: 'Serial' },
]

export type CertificateLayout = {
  page: { width: number; height: number }
  fields: Record<StationeryField, FieldBox>
  qr: { x: number; y: number; size: number }
}

export const DEFAULT_CERTIFICATE_LAYOUT: CertificateLayout = {
  page: { width: 297, height: 210 },
  fields: {
    studentName: { x: 48.5, y: 88, w: 200, align: 'center', size: 24, bold: true, caps: true },
    programme: { x: 48.5, y: 112, w: 200, align: 'center', size: 17, bold: true },
    division: { x: 48.5, y: 128, w: 200, align: 'center', size: 13, italic: true },
    awardYear: { x: 118.5, y: 141, w: 60, align: 'center', size: 13, bold: true },
    certificateNo: { x: 22, y: 20, w: 90, align: 'left', size: 10, prefix: 'Certificate No. ' },
    enrollmentNo: { x: 22, y: 26, w: 90, align: 'left', size: 10, prefix: 'Enrollment No. ' },
    issuedOn: { x: 22, y: 186, w: 80, align: 'left', size: 10, prefix: 'Date: ' },
    serial: { x: 235, y: 187.5, w: 50, align: 'center', size: 7 },
  },
  qr: { x: 247, y: 158, size: 26 },
}

function num(v: unknown, min: number, max: number, fb: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 10) / 10)) : fb
}

export function normaliseCertificateLayout(v: unknown): CertificateLayout {
  const o = obj(v)
  const d = DEFAULT_CERTIFICATE_LAYOUT
  const fieldsIn = obj(o.fields)
  const fields = {} as Record<StationeryField, FieldBox>
  for (const { id } of STATIONERY_FIELDS) {
    const f = obj(fieldsIn[id])
    const df = d.fields[id]
    fields[id] = {
      x: num(f.x, 0, 297, df.x),
      y: num(f.y, 0, 210, df.y),
      w: num(f.w, 5, 297, df.w),
      align: f.align === 'left' || f.align === 'right' || f.align === 'center' ? f.align : df.align,
      size: num(f.size, 5, 48, df.size),
      bold: f.bold === undefined ? df.bold : Boolean(f.bold),
      italic: f.italic === undefined ? df.italic : Boolean(f.italic),
      caps: f.caps === undefined ? df.caps : Boolean(f.caps),
      prefix: f.prefix === undefined ? df.prefix : str(f.prefix, 40),
    }
  }
  const qr = obj(o.qr)
  return {
    page: d.page,
    fields,
    qr: {
      x: num(qr.x, 0, 297, d.qr.x),
      y: num(qr.y, 0, 210, d.qr.y),
      size: num(qr.size, 12, 60, d.qr.size),
    },
  }
}

/* ============================================================ registry */

export type SettingKey =
  | 'site'
  | 'branding'
  | 'home'
  | 'menu'
  | 'footerLinks'
  | 'recognition'
  | 'examinations'
  | 'certificateLayout'
  | 'popupNotice'
  | 'affiliations'
  | 'syllabus'

export type SettingValue = {
  site: SiteSettings
  branding: Branding
  home: HomeContent
  menu: MenuItem[]
  footerLinks: FooterLink[]
  recognition: Recognition
  examinations: Examinations
  certificateLayout: CertificateLayout
  popupNotice: PopupNotice
  affiliations: DocumentList
  syllabus: DocumentList
}

export const SETTING_DEFAULTS: SettingValue = {
  site: DEFAULT_SITE,
  branding: DEFAULT_BRANDING,
  home: DEFAULT_HOME,
  menu: DEFAULT_MENU,
  footerLinks: DEFAULT_FOOTER_LINKS,
  recognition: DEFAULT_RECOGNITION,
  examinations: DEFAULT_EXAMINATIONS,
  certificateLayout: DEFAULT_CERTIFICATE_LAYOUT,
  popupNotice: DEFAULT_POPUP_NOTICE,
  affiliations: DEFAULT_DOCUMENT_LIST,
  syllabus: DEFAULT_DOCUMENT_LIST,
}

export const SETTING_NORMALISERS: { [K in SettingKey]: (v: unknown) => SettingValue[K] } = {
  site: normaliseSite,
  branding: normaliseBranding,
  home: normaliseHome,
  menu: normaliseMenu,
  footerLinks: normaliseFooterLinks,
  recognition: normaliseRecognition,
  examinations: normaliseExaminations,
  certificateLayout: normaliseCertificateLayout,
  popupNotice: normalisePopupNotice,
  affiliations: normaliseDocumentList,
  syllabus: normaliseDocumentList,
}

export function isSettingKey(v: unknown): v is SettingKey {
  return typeof v === 'string' && v in SETTING_DEFAULTS
}

/* ================================================================ other */

export const NOTICE_CATEGORIES = ['General', 'Examination', 'Admission', 'Placement', 'Result'] as const
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number]

export const PROGRAMME_MODES = ['Full-time', 'Part-time', 'Distance'] as const

export function formatNoticeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
