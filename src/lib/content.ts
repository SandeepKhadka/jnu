import 'server-only'

import { unstable_cache } from 'next/cache'

import { db } from '@/lib/db'
import type {
  FacultyDTO,
  GalleryCategoryDTO,
  NoticeDTO,
  PageDTO,
  SlideDTO,
} from '@/lib/content-dto'
import {
  FALLBACK_BRANDING,
  SETTING_DEFAULTS,
  SETTING_NORMALISERS,
  normaliseBlocks,
  normaliseCrumbs,
  type MenuItem,
  type ResolvedBranding,
  type SettingKey,
  type SettingValue,
} from '@/lib/content-types'
import { parseVariants, pickVariant, srcSetFor, fallbackFormat } from '@/lib/media-shared'

/**
 * Every read the PUBLIC site makes of editable content.
 *
 * Wrapped in unstable_cache under the tag CONTENT_TAG. Public pages are
 * prerendered to static HTML at build time from these reads, and stay static
 * — search engines get complete HTML, visitors never wait on a database. When
 * an admin saves, lib/revalidate.ts invalidates the tag and the affected
 * pages regenerate on the next request.
 *
 * Admin screens call the *Admin variants, which bypass the cache and include
 * unpublished rows.
 */

export const CONTENT_TAG = 'content'

const cached = <A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { tags: [CONTENT_TAG] })

/* ============================================================== settings */

export async function readSetting<K extends SettingKey>(key: K): Promise<SettingValue[K]> {
  const row = await db.setting.findUnique({ where: { key } })
  if (!row) return SETTING_DEFAULTS[key]
  try {
    return SETTING_NORMALISERS[key](JSON.parse(row.value)) as SettingValue[K]
  } catch {
    return SETTING_DEFAULTS[key]
  }
}

export const getSetting = cached(readSetting, 'setting') as <K extends SettingKey>(
  key: K
) => Promise<SettingValue[K]>

export const getSite = () => getSetting('site')

/* ============================================================== branding */

async function mediaVariants(id: string | null) {
  if (!id) return null
  const m = await db.media.findUnique({ where: { id } })
  if (!m || m.kind !== 'IMAGE') return null
  return { variants: parseVariants(m.variants), width: m.width ?? 0, height: m.height ?? 0 }
}

async function readBranding(): Promise<ResolvedBranding> {
  const b = await readSetting('branding')
  const out: ResolvedBranding = JSON.parse(JSON.stringify(FALLBACK_BRANDING))

  const logo = await mediaVariants(b.logoId)
  if (logo && logo.variants.length) {
    const f = fallbackFormat(logo.variants)
    // Header shows the lockup ~56px tall; keep the intrinsic ratio.
    const displayH = 78
    out.logo = {
      src: pickVariant(logo.variants, 640)?.path ?? out.logo.src,
      srcSet: srcSetFor(logo.variants, f),
      width: Math.round((logo.width / logo.height) * displayH) || out.logo.width,
      height: displayH,
    }
  }

  const crest = await mediaVariants(b.crestId)
  if (crest) out.crest = pickVariant(crest.variants, 320)?.path ?? out.crest

  const og = await mediaVariants(b.ogImageId)
  if (og) out.ogImage = pickVariant(og.variants, 1200)?.path ?? out.ogImage

  return out
}

export const getBranding = cached(readBranding, 'branding')

/* ======================================================= programmes */

async function readFaculties(includeUnpublished: boolean): Promise<FacultyDTO[]> {
  const rows = await db.faculty.findMany({
    where: includeUnpublished ? {} : { published: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      programmes: {
        where: includeUnpublished ? {} : { published: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
    },
  })
  return rows.map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    summary: f.summary,
    published: f.published,
    sortOrder: f.sortOrder,
    programmes: f.programmes.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      award: p.award,
      durationMonths: p.durationMonths,
      mode: p.mode,
      eligibility: p.eligibility,
      intake: p.intake,
      published: p.published,
      sortOrder: p.sortOrder,
    })),
  }))
}

export const getFaculties = cached(() => readFaculties(false), 'faculties')
export const getFacultiesAdmin = () => readFaculties(true)

export async function getFaculty(slug: string): Promise<FacultyDTO | undefined> {
  return (await getFaculties()).find((f) => f.slug === slug)
}

export async function getAllProgrammeNames(): Promise<string[]> {
  return (await getFaculties()).flatMap((f) => f.programmes.map((p) => p.name))
}

/* ================================================================ pages */

type PageRow = {
  id: string
  path: string
  title: string
  description: string
  intro: string | null
  body: string
  crumbs: string
  published: boolean
  updatedAt: Date
}

function toPage(r: PageRow): PageDTO {
  const parse = (s: string) => {
    try {
      return JSON.parse(s)
    } catch {
      return []
    }
  }
  return {
    id: r.id,
    path: r.path,
    title: r.title,
    description: r.description,
    intro: r.intro,
    body: normaliseBlocks(parse(r.body)),
    crumbs: normaliseCrumbs(parse(r.crumbs)),
    published: r.published,
    updatedAt: r.updatedAt.toISOString(),
  }
}

export const getPage = cached(async (path: string): Promise<PageDTO | null> => {
  const row = await db.page.findUnique({ where: { path } })
  return row && row.published ? toPage(row) : null
}, 'page')

export const getPublishedPagePaths = cached(async (): Promise<{ path: string; updatedAt: string }[]> => {
  const rows = await db.page.findMany({
    where: { published: true },
    select: { path: true, updatedAt: true },
    orderBy: { path: 'asc' },
  })
  return rows.map((r) => ({ path: r.path, updatedAt: r.updatedAt.toISOString() }))
}, 'page-paths')

export async function listPagesAdmin(): Promise<PageDTO[]> {
  const rows = await db.page.findMany({ orderBy: { path: 'asc' } })
  return rows.map(toPage)
}

export async function getPageAdmin(id: string): Promise<PageDTO | null> {
  const row = await db.page.findUnique({ where: { id } })
  return row ? toPage(row) : null
}

/* ============================================================== notices */

async function readNotices(includeUnpublished: boolean): Promise<NoticeDTO[]> {
  const rows = await db.notice.findMany({
    where: includeUnpublished ? {} : { published: true },
    include: { file: { select: { path: true } } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
  const list = rows.map((n) => ({
    id: n.id,
    date: n.date,
    title: n.title,
    category: n.category,
    href: n.href,
    fileId: n.fileId,
    fileUrl: n.file?.path ?? null,
    pinned: n.pinned,
    published: n.published,
  }))
  // Pinned first, then newest first.
  return list.sort((a, b) =>
    a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : b.date.localeCompare(a.date)
  )
}

export const getNotices = cached(() => readNotices(false), 'notices')
export const getNoticesAdmin = () => readNotices(true)

/* ======================================================= slides, gallery */

async function readSlides(includeDisabled: boolean): Promise<SlideDTO[]> {
  const rows = await db.slide.findMany({
    where: includeDisabled ? {} : { enabled: true },
    include: { media: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map((s) => ({
    id: s.id,
    mediaId: s.mediaId,
    alt: s.alt,
    banner: s.banner,
    bannerBackground: s.bannerBackground,
    enabled: s.enabled,
    sortOrder: s.sortOrder,
    width: s.media.width ?? 1600,
    height: s.media.height ?? 658,
    variants: parseVariants(s.media.variants),
  }))
}

export const getSlides = cached(() => readSlides(false), 'slides')
export const getSlidesAdmin = () => readSlides(true)

async function readGallery(includeUnpublished: boolean): Promise<GalleryCategoryDTO[]> {
  const rows = await db.galleryCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    include: {
      photos: {
        where: includeUnpublished ? {} : { published: true },
        include: { media: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    blurb: c.blurb,
    sortOrder: c.sortOrder,
    photos: c.photos.map((p) => ({
      id: p.id,
      mediaId: p.mediaId,
      categoryId: p.categoryId,
      alt: p.alt,
      caption: p.caption,
      published: p.published,
      sortOrder: p.sortOrder,
      width: p.media.width ?? 495,
      height: p.media.height ?? 400,
      variants: parseVariants(p.media.variants),
    })),
  }))
}

export const getGallery = cached(() => readGallery(false), 'gallery')
export const getGalleryAdmin = () => readGallery(true)

/* ================================================================= menu */

/** The menu with any `auto: 'faculties'` item expanded to the live faculties. */
export async function getResolvedMenu(): Promise<MenuItem[]> {
  const [menu, faculties] = await Promise.all([getSetting('menu'), getFaculties()])
  return menu.map((item) =>
    item.auto === 'faculties'
      ? {
          ...item,
          children: faculties.map((f) => ({
            label: `Faculty of ${f.name}`,
            href: `/programmes/${f.slug}/`,
          })),
        }
      : item
  )
}
