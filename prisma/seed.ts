/**
 * Loads the site's REAL content into an empty database.
 *
 *   npm run db:seed          (also runs as part of `npm run build`)
 *
 * Source: the content/*.ts files the site was built from. After this runs the
 * DATABASE is the source of truth — the admin panel edits it — and those files
 * are only ever read again to fill a brand-new database.
 *
 * Safe to run on every build: each table is filled only when it is EMPTY, and
 * a setting is written only when it is MISSING. It never overwrites anything
 * an administrator has changed.
 *
 * Creates no accounts and no student data. The first administrator comes
 * from `npm run admin:create`; demo students from `npm run db:seed:demo`.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

import { contentPages } from '../content/pages'
import { faculties } from '../content/programmes'
import { notices } from '../content/notices'
import { galleryCategories, galleryPhotos, slides, SLIDE_WIDTHS } from '../content/gallery'
import { SETTING_DEFAULTS, type SettingKey } from '../src/lib/content-types'

const db = new PrismaClient()

async function settings() {
  let n = 0
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    const exists = await db.setting.findUnique({ where: { key } })
    if (exists) continue
    await db.setting.create({ data: { key, value: JSON.stringify(SETTING_DEFAULTS[key]), updatedBy: 'seed' } })
    n++
  }
  return n
}

async function programmes() {
  if ((await db.faculty.count()) > 0) return 0
  let order = 0
  for (const f of faculties) {
    await db.faculty.create({
      data: {
        slug: f.slug,
        name: f.name,
        summary: f.summary,
        sortOrder: order++,
        programmes: {
          create: f.programmes.map((p, i) => ({
            slug: p.slug,
            name: p.name,
            award: p.award,
            durationMonths: p.durationMonths,
            mode: p.mode,
            eligibility: p.eligibility,
            intake: p.intake ?? null,
            sortOrder: i,
          })),
        },
      },
    })
  }
  return faculties.length
}

async function pages() {
  if ((await db.page.count()) > 0) return 0
  for (const p of contentPages) {
    await db.page.create({
      data: {
        path: p.path,
        title: p.title,
        description: p.description,
        intro: p.intro ?? null,
        body: JSON.stringify(p.body),
        crumbs: JSON.stringify(p.crumbs),
      },
    })
  }
  return contentPages.length
}

async function noticesSeed() {
  if ((await db.notice.count()) > 0) return 0
  for (const n of notices) {
    let fileId: string | null = null
    if (n.file) {
      // The PDFs ship in public/documents: register them as static media.
      const m = await db.media.create({
        data: {
          storage: 'static',
          kind: 'DOCUMENT',
          filename: n.file.split('/').pop() ?? 'document.pdf',
          contentType: 'application/pdf',
          bytes: 0,
          path: n.file,
          createdBy: 'seed',
        },
      })
      fileId = m.id
    }
    await db.notice.create({
      data: {
        date: n.date,
        title: n.title,
        category: n.category,
        href: n.href ?? null,
        fileId,
        pinned: Boolean(n.pinned),
      },
    })
  }
  return notices.length
}

async function carousel() {
  if ((await db.slide.count()) > 0) return 0
  let order = 0
  for (const s of slides) {
    // Encoded by scripts/optimise-images.ts into public/images/carousel/.
    const variants = SLIDE_WIDTHS.flatMap((w) =>
      (['avif', 'webp', 'jpg'] as const).map((format) => ({
        w,
        format,
        path: `/images/carousel/${s.slug}-${w}.${format}`,
      }))
    )
    const height = s.keepTopRows ?? 658
    const media = await db.media.create({
      data: {
        storage: 'static',
        kind: 'IMAGE',
        filename: s.source,
        contentType: 'image/jpeg',
        bytes: 0,
        width: 1600,
        height,
        alt: s.alt,
        variants: JSON.stringify(variants),
        createdBy: 'seed',
      },
    })
    await db.slide.create({
      data: {
        mediaId: media.id,
        alt: s.alt,
        banner: Boolean(s.banner),
        bannerBackground: s.banner?.background ?? null,
        enabled: s.enabled,
        sortOrder: order++,
      },
    })
  }
  return slides.length
}

async function gallery() {
  if ((await db.galleryCategory.count()) > 0) return 0
  const idBySlug = new Map<string, string>()
  let order = 0
  for (const c of galleryCategories) {
    const row = await db.galleryCategory.create({
      data: { slug: c.id, title: c.title, blurb: c.blurb, sortOrder: order++ },
    })
    idBySlug.set(c.id, row.id)
  }
  const perCategory = new Map<string, number>()
  for (const p of galleryPhotos) {
    const media = await db.media.create({
      data: {
        storage: 'static',
        kind: 'IMAGE',
        filename: p.source,
        contentType: 'image/jpeg',
        bytes: 0,
        width: 495,
        height: 400,
        alt: p.alt,
        variants: JSON.stringify([
          { w: 495, format: 'webp', path: `/images/gallery/${p.slug}.webp` },
          { w: 495, format: 'jpg', path: `/images/gallery/${p.slug}.jpg` },
        ]),
        createdBy: 'seed',
      },
    })
    const n = perCategory.get(p.category) ?? 0
    perCategory.set(p.category, n + 1)
    await db.galleryPhoto.create({
      data: {
        mediaId: media.id,
        categoryId: idBySlug.get(p.category)!,
        alt: p.alt,
        caption: p.caption,
        sortOrder: n,
      },
    })
  }
  return galleryPhotos.length
}

async function main() {
  const counts = {
    settings: await settings(),
    faculties: await programmes(),
    pages: await pages(),
    notices: await noticesSeed(),
    slides: await carousel(),
    photos: await gallery(),
  }
  const added = Object.entries(counts).filter(([, n]) => n > 0)
  console.log(
    added.length
      ? `content seeded: ${added.map(([k, n]) => `${n} ${k}`).join(', ')}`
      : 'content already present — nothing to seed'
  )
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
