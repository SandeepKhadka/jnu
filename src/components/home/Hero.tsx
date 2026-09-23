'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { SlideDTO } from '@/lib/content-dto'
import type { HomeContent } from '@/lib/content-types'
import { fallbackFormat, pickVariant, srcSetFor } from '@/lib/media-shared'

/**
 * Homepage carousel — the university's own campus photography.
 *
 * The original site shipped this same carousel as four 1600px JPEGs totalling
 * 2.4 MB, all loaded up front; it was the site's worst performance problem.
 * The pictures are the same; the delivery is not:
 *
 *   - AVIF / WebP / JPEG at 640, 1024 and 1600px (scripts/optimise-images.ts),
 *     so a phone downloads ~18 KB for the first slide instead of ~720 KB.
 *   - Only the first slide is in the HTML, eager and high-priority: it is
 *     the Largest Contentful Paint. The others get their <img> only once they
 *     are current or next in line. `loading="lazy"` alone is not enough here:
 *     the slides are stacked in the same box at opacity 0, so the browser
 *     counts them as in the viewport and fetches them all on load — measured,
 *     before this was fixed.
 *   - Explicit dimensions on every image, so nothing shifts (CLS).
 *
 * Accessibility follows the WAI carousel pattern: labelled region and slides,
 * previous/next and per-slide controls, rotation that pauses on hover and on
 * keyboard focus, and no autoplay at all for anyone who has asked their
 * system for reduced motion. There is deliberately no play/pause button (the
 * client's choice); hover, focus and reduced-motion are the pause mechanisms
 * that remain, which is why none of them should be removed. While it rotates on its own the live
 * region is off, so screen readers are not interrupted every six seconds.
 *
 * The caption carries the homepage <h1>, which the page previously lacked.
 */

const INTERVAL_MS = 6000

function sources(slide: SlideDTO) {
  const f = fallbackFormat(slide.variants)
  return {
    avif: srcSetFor(slide.variants, 'avif'),
    webp: srcSetFor(slide.variants, 'webp'),
    fallbackSet: srcSetFor(slide.variants, f),
    fallback: pickVariant(slide.variants, 1024)?.path ?? '',
  }
}

export function Hero({ slides, home }: { slides: SlideDTO[]; home: HomeContent }) {
  const [index, setIndex] = useState(0)
  /** False only for users who have asked their system for reduced motion. */
  const [autoplay, setAutoplay] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const regionRef = useRef<HTMLElement>(null)
  /** Slides whose image may be requested. Starts with the LCP slide only. */
  const [armed, setArmed] = useState<Set<number>>(() => new Set([0]))

  // Only once the page has finished loading may the NEXT slide be fetched —
  // before that it would compete with the LCP image and the page's own CSS
  // and scripts for bandwidth. The first rotation is 6s away; plenty of time.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const done = () => window.setTimeout(() => setSettled(true), 800)
    if (document.readyState === 'complete') done()
    else window.addEventListener('load', done, { once: true })
    return () => window.removeEventListener('load', done)
  }, [])

  // Arm the current slide (always) and, once settled, the one after it, so the
  // next image is already there when the carousel advances.
  useEffect(() => {
    setArmed((prev) => {
      const want = settled ? [index, (index + 1) % slides.length] : [index]
      if (want.every((i) => prev.has(i))) return prev
      return new Set([...prev, ...want])
    })
  }, [index, settled, slides.length])

  // Respect reduced motion: never start rotating for these users.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setAutoplay(false)
  }, [])

  const go = useCallback(
    (to: number) => setIndex(((to % slides.length) + slides.length) % slides.length),
    [slides.length]
  )

  const rotating = autoplay && !hovered && !focused && slides.length > 1
  /** A text banner is on screen: show it whole and move the caption aside. */
  const onBanner = Boolean(slides[index]?.banner)

  useEffect(() => {
    if (!rotating) return
    const id = window.setInterval(() => {
      // Do not advance a tab nobody is looking at.
      if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % slides.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [rotating, slides.length])

  return (
    <section
      ref={regionRef}
      className="relative border-b border-hair bg-jnu-900"
      aria-roledescription="carousel"
      aria-label="Campus photographs"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!regionRef.current?.contains(e.relatedTarget as Node)) setFocused(false)
      }}
    >
      <div className="relative h-[210px] overflow-hidden sm:h-[340px] md:h-[560px] lg:h-[660px]">
        <div aria-live={rotating ? 'off' : 'polite'} className="h-full">
          {slides.map((s, i) => {
            const src = sources(s)
            const active = i === index
            return (
              <div
                key={s.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                aria-hidden={!active}
                className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                  active ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                style={s.banner ? { background: s.bannerBackground ?? '#ffffff' } : undefined}
              >
                {armed.has(i) ? (
                <picture>
                  {src.avif ? <source type="image/avif" srcSet={src.avif} sizes="100vw" /> : null}
                  {src.webp ? <source type="image/webp" srcSet={src.webp} sizes="100vw" /> : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src.fallback}
                    srcSet={src.fallbackSet}
                    sizes="100vw"
                    alt={s.alt}
                    width={s.width}
                    height={s.height}
                    // Slide 1 is the LCP element: eager and first in the queue.
                    // Every other slide waits until it is needed.
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'low'}
                    decoding={i === 0 ? 'sync' : 'async'}
                    // Photographs fill the frame; text banners are shown
                    // whole, since cropping would cut their words off.
                    className={`h-full w-full object-center ${s.banner ? 'object-contain' : 'object-cover'}`}
                  />
                </picture>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Legibility shade under the caption on wide screens. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-jnu-900/75 via-jnu-900/25 to-transparent transition-opacity duration-700 md:block ${
            onBanner ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photograph"
              className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-xl text-white hover:bg-black/55 focus-visible:bg-black/55"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photograph"
              className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-xl text-white hover:bg-black/55 focus-visible:bg-black/55"
            >
              <span aria-hidden="true">›</span>
            </button>

            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full bg-black/35 px-2.5 py-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show photograph ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === index ? 'bg-white' : 'bg-white/45 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}

      </div>

      {/*
        Caption — rendered ONCE. It used to be two copies (an md+ overlay and a
        stacked mobile version, each hidden at the other size), which put two
        <h1> elements in the HTML: exactly the heading defect this component
        was meant to fix. One element, positioned per breakpoint: below the
        image on phones (the copy is taller than the mobile image, and
        overlaying it spilled onto the nav), over it from md up.
      */}
      <div
        className={`boxed relative z-[5] transition-opacity duration-700 md:pointer-events-none md:absolute md:inset-y-0 md:left-0 md:right-0 md:flex md:items-center ${
          onBanner ? 'md:opacity-0 md:[&_*]:!pointer-events-none' : ''
        }`}
      >
        <Caption home={home} />
      </div>
    </section>
  )
}

function Caption({ home }: { home: HomeContent }) {
  return (
    <div className="my-4 max-w-2xl rounded border border-white/15 bg-jnu-900/90 p-6 md:pointer-events-auto md:m-0 md:bg-jnu-900/80 md:p-9">
      {/*
        The homepage <h1>. It leads with the university's name — the query the
        page most needs to rank for — as a small eyebrow line, followed by what
        the university does.
      */}
      <h1 className="m-0 font-display uppercase leading-tight tracking-wide text-white">
        {home.heroEyebrow ? (
          <span className="mb-2 block text-[13px] tracking-[0.2em] text-sand-400 md:text-[15px]">
            {home.heroEyebrow}
          </span>
        ) : null}
        <span className="block text-[28px] md:text-[38px]">{home.heroHeadline}</span>
      </h1>
      {home.heroBody ? (
        <p className="mb-6 mt-4 text-[15.5px] leading-relaxed text-jnu-100">{home.heroBody}</p>
      ) : (
        <div className="mb-5" />
      )}
      <div className="flex flex-wrap gap-2">
        <Link href={home.primaryCta.href} className="btn btn-sand">
          {home.primaryCta.label}
        </Link>
        <Link href={home.secondaryCta.href} className="btn btn-secondary">
          {home.secondaryCta.label}
        </Link>
      </div>
    </div>
  )
}
