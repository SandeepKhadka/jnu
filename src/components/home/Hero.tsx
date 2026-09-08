import Link from 'next/link'

/**
 * A single hero, not a four-slide carousel.
 *
 * The original shipped four 1600x658 JPEGs totalling 2.48 MB — one of them
 * 1.09 MB on its own — as the largest contentful paint. That was the site's
 * worst performance defect. One optimised image keeps the period look while
 * putting LCP under a second.
 *
 * Drop a real campus photo at /public/images/campus-hero.avif (plus .jpg
 * fallback), pre-sized to 1600px wide and compressed to ~120 KB.
 */
export function Hero() {
  return (
    <section className="border-b border-hair bg-jnu-900" aria-labelledby="hero-heading">
      <div className="relative">
        {/*
          Currently an SVG placeholder so nothing renders broken. When the real
          photo arrives, export it three ways and restore the <source> lines:
            <source srcSet="/images/campus-hero.avif" type="image/avif" />
            <source srcSet="/images/campus-hero.webp" type="image/webp" />
          then point src at campus-hero.jpg as the final fallback.
        */}
        <picture>
          <img
            src="/images/campus-hero.svg"
            alt="Students on the Jodhpur National University campus"
            width={1600}
            height={560}
            // The LCP element: eager, high priority, never lazy.
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="h-[280px] w-full object-cover md:h-[420px]"
          />
        </picture>

        {/* Caption box overlay — the era's signature slider treatment. */}
        <div className="boxed pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-center">
          <div className="pointer-events-auto max-w-xl rounded border border-white/15 bg-jnu-900/80 p-5 md:p-7">
            <h2
              id="hero-heading"
              className="m-0 font-display text-[22px] uppercase leading-tight tracking-wide text-white md:text-[28px]"
            >
              Professional and technical education in Jodhpur
            </h2>
            <p className="mb-5 mt-3 text-[14px] leading-relaxed text-jnu-100">
              Programmes across engineering, management, pharmacy, computer applications,
              law, education, arts and commerce.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/faculty/" className="btn btn-sand">
                Browse Programmes
              </Link>
              <Link href="/admission/process/" className="btn btn-secondary">
                Admission Process
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
