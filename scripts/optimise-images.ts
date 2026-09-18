/**
 * Builds every image the site serves from the client's originals.
 *
 *   npm run images -- "C:/Users/ACER/Desktop/JNU"
 *
 * Why a build step rather than dropping the originals into public/:
 * next.config.mjs sets `images: { unoptimized: true }`, so whatever is in
 * public/ is exactly what a visitor downloads. The original carousel was four
 * 1600px JPEGs totalling 2.4 MB, one of them 1.07 MB — the old site's single
 * worst performance problem, on its most important page. This script encodes
 * AVIF, WebP and a JPEG fallback at several widths so each device downloads
 * roughly what it can display.
 *
 * What it writes:
 *   public/images/carousel/<slug>-<w>.{avif,webp,jpg}   homepage slides
 *   public/images/gallery/<slug>.{webp,jpg}             Photo Tour
 *   public/images/brand/jnu-logo-lockup[@2x].png        header logo
 *   public/images/brand/jnu-logo-lockup.png             also the schema logo
 *   public/images/brand/jnu-crest.png                   crest, cut from the lockup
 *   public/images/brand/icon.png, apple-icon.png        default favicon + icon
 *   public/og/default.jpg                               1200x630 social share card
 *
 * Idempotent; safe to re-run after replacing any original.
 */
import { mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { galleryPhotos, slides, SLIDE_WIDTHS } from '../content/gallery'

const ROOT = process.cwd()
const SRC = process.argv[2]

if (!SRC) {
  console.error('Usage: npm run images -- "<folder with the originals>"')
  process.exit(1)
}

const out = (...p: string[]) => path.join(ROOT, ...p)
const src = (...p: string[]) => path.join(SRC, ...p)

let totalBytes = 0
async function track(file: string) {
  totalBytes += (await stat(file)).size
}

async function clean(dir: string) {
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
}

/* ----------------------------------------------------------------- slides */
async function buildSlides() {
  const dir = out('public', 'images', 'carousel')
  await clean(dir)

  for (const s of slides) {
    for (const w of SLIDE_WIDTHS) {
      const full = sharp(src(s.source))
      const meta = await full.metadata()
      // Crop BEFORE resizing, in its own pass: sharp would otherwise apply the
      // extract after the resize, against the wrong dimensions.
      const cropped = s.keepTopRows
        ? await full
            .extract({ left: 0, top: 0, width: meta.width ?? 1600, height: s.keepTopRows })
            .toBuffer()
        : await full.toBuffer()
      const base = sharp(cropped).resize({ width: w, withoutEnlargement: true })
      const stem = path.join(dir, `${s.slug}-${w}`)
      await base.clone().avif({ quality: 50, effort: 6 }).toFile(`${stem}.avif`)
      await base.clone().webp({ quality: 72, effort: 6 }).toFile(`${stem}.webp`)
      await base.clone().jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(`${stem}.jpg`)
      for (const ext of ['avif', 'webp', 'jpg']) await track(`${stem}.${ext}`)
    }
  }
  console.log(`slides:  ${slides.length} × ${SLIDE_WIDTHS.length} widths × 3 formats`)
}

/* ---------------------------------------------------------------- gallery */
async function buildGallery() {
  const dir = out('public', 'images', 'gallery')
  await clean(dir)

  for (const p of galleryPhotos) {
    const stem = path.join(dir, p.slug)
    // Originals are 495 x 400: already the display size, so re-encode only.
    const base = sharp(src(p.source))
    await base.clone().webp({ quality: 78, effort: 6 }).toFile(`${stem}.webp`)
    await base.clone().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(`${stem}.jpg`)
    await track(`${stem}.webp`)
    await track(`${stem}.jpg`)
  }
  console.log(`gallery: ${galleryPhotos.length} photos × 2 formats`)
}

/* ------------------------------------------------------------------ brand */
async function buildBrand() {
  const dir = out('public', 'images', 'brand')
  await clean(dir)
  const lockup = src('JNU_LOGO.png')
  const { width = 634 } = await sharp(lockup).metadata()

  // Header lockup: 1x at half the source width, 2x at full.
  const half = Math.round(width / 2)
  await sharp(lockup).resize({ width: half }).png({ palette: true, quality: 90 }).toFile(path.join(dir, 'jnu-logo-lockup.png'))
  await sharp(lockup).png({ palette: true, quality: 90 }).toFile(path.join(dir, 'jnu-logo-lockup@2x.png'))
  // No WebP: for a flat-colour logo the palette PNG is the smaller file
  // (9.5 KB against 17.6 KB at 1x when measured).

  // Crest: the roundel at the left of the lockup, trimmed tight and padded
  // square. The source is only ~90px across, so every derivative is made
  // from it once, with a quality kernel, rather than chained.
  // Two passes: within one pipeline sharp trims BEFORE it extracts, which
  // shrinks the image first and makes the extract area invalid.
  const crestRegion = await sharp(lockup)
    // Column 89 is the empty gap between the roundel and the first letter of
    // the Hindi name; any wider and a fleck of that letter comes with it.
    .extract({ left: 0, top: 0, width: 89, height: 156 })
    .png()
    .toBuffer()
  const crestRaw = await sharp(crestRegion)
    .trim({ threshold: 20 })
    .toBuffer({ resolveWithObject: true })
  const side = Math.max(crestRaw.info.width, crestRaw.info.height)
  const crestSquare = await sharp(crestRaw.data)
    .extend({
      top: Math.floor((side - crestRaw.info.height) / 2),
      bottom: Math.ceil((side - crestRaw.info.height) / 2),
      left: Math.floor((side - crestRaw.info.width) / 2),
      right: Math.ceil((side - crestRaw.info.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp(crestSquare).png().toFile(path.join(dir, 'jnu-crest.png'))
  await sharp(crestSquare).resize(48, 48, { kernel: 'lanczos3' }).png().toFile(out('public', 'images', 'brand', 'icon.png'))
  // Home-screen icon: crest on white, iOS masks transparency to black.
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(crestSquare).resize(152, 152, { kernel: 'lanczos3' }).toBuffer(), gravity: 'center' }])
    .png()
    .toFile(out('public', 'images', 'brand', 'apple-icon.png'))

  console.log(`brand:   lockup 1x/2x png, crest ${side}px, favicon, apple icon`)
  return { crestSize: side }
}

/* -------------------------------------------------------------- og image */
async function buildOgImage() {
  const W = 1200
  const H = 630
  const photo = await sharp(src('header_carousel_1.jpg'))
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .toBuffer()

  // Left-to-right shade so the white card reads on any photo.
  const shade = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1">
      <stop offset="0" stop-color="#0d2340" stop-opacity="0.92"/>
      <stop offset="0.55" stop-color="#0d2340" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0d2340" stop-opacity="0.05"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/></svg>`
  )

  const logo = await sharp(src('JNU_LOGO.png')).resize({ width: 520 }).png().toBuffer()
  const logoH = (await sharp(logo).metadata()).height ?? 128
  const card = await sharp({
    create: { width: 580, height: logoH + 40, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.96 } },
  })
    .composite([{ input: logo, left: 30, top: 20 }])
    .png()
    .toBuffer()

  const text = Buffer.from(
    `<svg width="${W}" height="${H}">
      <style>.t{font-family:'Segoe UI',Arial,sans-serif;fill:#fff}</style>
      <text x="70" y="${120 + logoH + 110}" class="t" font-size="34" font-weight="600">Professional and technical education</text>
      <text x="70" y="${120 + logoH + 156}" class="t" font-size="26" opacity="0.9">Boranada campus · Jodhpur, Rajasthan</text>
    </svg>`
  )

  // JPEG, not PNG: this is a photograph, and as PNG it was 1.29 MB. WhatsApp
  // drops link previews for images over roughly 300 KB.
  const file = out('public', 'og', 'default.jpg')
  await mkdir(path.dirname(file), { recursive: true })
  await sharp(photo)
    .composite([
      { input: shade, left: 0, top: 0 },
      { input: card, left: 50, top: 100 },
      { input: text, left: 0, top: 0 },
    ])
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(file)
  await track(file)
  console.log('og:      1200×630 share card from the campus aerial')
}

async function main() {
  await buildSlides()
  await buildGallery()
  await buildBrand()
  await buildOgImage()
  console.log(`\nwritten: ${(totalBytes / 1024 / 1024).toFixed(2)} MB across all formats and sizes`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
