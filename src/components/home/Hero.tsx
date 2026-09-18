'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { enabledSlides, SLIDE_WIDTHS, type Slide } from '@/content/gallery'
import { site } from '@/content/site'

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
 * keyboard focus, a pause button, and no autoplay at all for anyone who has
 * asked their system for reduced motion. While it rotates on its own the live
 * region is off, so screen readers are not interrupted every six seconds.
 *
 * The caption carries the homepage <h1>, which the page previously lacked.
 */

const INTERVAL_MS = 6000

function sources(slide: Slide) {
  const set = (ext: string) =>
    SLIDE_WIDTHS.map((w) => `/images/carousel/${slide.slug}-${w}.${ext} ${w}w`).join(', ')
  return {
    avif: set('avif'),
    webp: set('webp'),
    jpg: set('jpg'),
    fallback: `/images/carousel/${slide.slug}-1024.jpg`,
  }
}

export function Hero() {
  const slides = enabledSlides
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
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
    if (mq.matches) setPlaying(false)
  }, [])

  const go = useCallback(
    (to: number) => setIndex(((to % slides.length) + slides.length) % slides.length),
    [slides.length]
  )

  const rotating = playing && !hovered && !focused && slides.length > 1

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
      <div className="relative h-[240px] overflow-hidden sm:h-[320px] md:h-[460px] lg:h-[520px]">
        <div aria-live={rotating ? 'off' : 'polite'} className="h-full">
          {slides.map((s, i) => {
            const src = sources(s)
            const active = i === index
            return (
              <div
                key={s.slug}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                aria-hidden={!active}
                className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                  active ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                {armed.has(i) ? (
                <picture>
                  <source type="image/avif" srcSet={src.avif} sizes="100vw" />
                  <source type="image/webp" srcSet={src.webp} sizes="100vw" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src.fallback}
                    srcSet={src.jpg}
                    sizes="100vw"
                    alt={s.alt}
                    width={1600}
                    height={658}
                    // Slide 1 is the LCP element: eager and first in the queue.
                    // Every other slide waits until it is needed.
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'low'}
                    decoding={i === 0 ? 'sync' : 'async'}
                    className="h-full w-full object-cover object-center"
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
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-jnu-900/75 via-jnu-900/25 to-transparent md:block"
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
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                className="grid h-5 w-5 place-items-center text-[11px] text-white"
              >
                <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
              </button>
              {slides.map((s, i) => (
                <button
                  key={s.slug}
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
      <div className="boxed relative z-[5] md:pointer-events-none md:absolute md:inset-y-0 md:left-0 md:right-0 md:flex md:items-center">
        <Caption />
      </div>
    </section>
  )
}

function Caption() {
  return (
    <div className="my-4 max-w-xl rounded border border-white/15 bg-jnu-900/90 p-5 md:pointer-events-auto md:m-0 md:bg-jnu-900/80 md:p-7">
      {/*
        The homepage <h1>. It leads with the university's name — the query the
        page most needs to rank for — as a small eyebrow line, followed by what
        the university does.
      */}
      <h1 className="m-0 font-display uppercase leading-tight tracking-wide text-white">
        <span className="mb-1.5 block text-[12px] tracking-[0.2em] text-sand-400 md:text-[13px]">
          {site.name}
        </span>
        <span className="block text-[22px] md:text-[28px]">
          Professional and technical education in Jodhpur
        </span>
      </h1>
      <p className="mb-5 mt-3 text-[14px] leading-relaxed text-jnu-100">
        Programmes in engineering, management, pharmacy, computer applications, law, education,
        sciences, the arts and allied health.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/programmes/" className="btn btn-sand">
          Browse Programmes
        </Link>
        <Link href="/admission/process/" className="btn btn-secondary">
          Apply Online
        </Link>
      </div>
    </div>
  )
}
