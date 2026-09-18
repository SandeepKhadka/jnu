'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { GalleryPhotoDTO } from '@/lib/content-dto'
import { fallbackFormat, pickVariant, srcSetFor } from '@/lib/media-shared'

/**
 * Photo Tour grid with a lightbox.
 *
 * The grid is server-rendered (this client component still prerenders), so
 * every <img>, alt text and caption is in the static HTML for image search —
 * nothing depends on JavaScript to exist. The lightbox is an enhancement on
 * top: a native <dialog>, which brings focus trapping, Escape-to-close and
 * the inert background for free, plus arrow-key navigation.
 *
 * Every image is lazy with explicit dimensions: the page has 27 of them and
 * none is above the fold.
 */


export function PhotoGallery({ photos }: { photos: GalleryPhotoDTO[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const show = useCallback((i: number) => {
    setOpen(i)
    const d = dialogRef.current
    if (d && !d.open) d.showModal()
  }, [])

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  const step = useCallback(
    (delta: number) =>
      setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  )

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    const onClose = () => setOpen(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    d.addEventListener('close', onClose)
    d.addEventListener('keydown', onKey)
    return () => {
      d.removeEventListener('close', onClose)
      d.removeEventListener('keydown', onKey)
    }
  }, [step])

  const current = open === null ? null : photos[open]

  return (
    <>
      {/* ! overrides: .prose-jnu ul (list-disc, pl-6, space-y-1) outranks plain utilities. */}
      <ul className="!m-0 grid !list-none grid-cols-2 gap-3 !space-y-0 !p-0 sm:grid-cols-3">
        {photos.map((p, i) => (
          <li key={p.id} className="m-0 p-0">
            <figure className="m-0">
              <button
                type="button"
                onClick={() => show(i)}
                className="group block w-full overflow-hidden rounded border border-hair bg-shell p-0"
                aria-label={`Enlarge: ${p.caption}`}
              >
                <picture>
                  {srcSetFor(p.variants, 'avif') ? (
                    <source type="image/avif" srcSet={srcSetFor(p.variants, 'avif')} sizes="(min-width: 640px) 33vw, 50vw" />
                  ) : null}
                  <source type="image/webp" srcSet={srcSetFor(p.variants, 'webp')} sizes="(min-width: 640px) 33vw, 50vw" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pickVariant(p.variants, 640)?.path}
                    srcSet={srcSetFor(p.variants, fallbackFormat(p.variants))}
                    sizes="(min-width: 640px) 33vw, 50vw"
                    alt={p.alt}
                    width={p.width}
                    height={p.height}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[5/4] h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                </picture>
              </button>
              <figcaption className="mt-1.5 text-[12.5px] leading-snug text-muted">
                {p.caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={current ? current.caption : 'Photograph'}
        className="m-auto max-h-[92vh] w-[min(94vw,620px)] rounded border-0 bg-jnu-900 p-0 text-white backdrop:bg-black/80"
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) close()
        }}
      >
        {current ? (
          <div className="p-3">
            <picture>
              {srcSetFor(current.variants, 'avif') ? (
                <source type="image/avif" srcSet={srcSetFor(current.variants, 'avif')} sizes="620px" />
              ) : null}
              <source type="image/webp" srcSet={srcSetFor(current.variants, 'webp')} sizes="620px" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pickVariant(current.variants, 1024)?.path}
                srcSet={srcSetFor(current.variants, fallbackFormat(current.variants))}
                sizes="620px"
                alt={current.alt}
                width={current.width}
                height={current.height}
                className="mx-auto block h-auto max-h-[72vh] w-full object-contain"
              />
            </picture>
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                className="rounded px-3 py-1.5 text-[13px] hover:bg-white/10"
                aria-label="Previous photograph"
              >
                ‹ Prev
              </button>
              <p className="m-0 text-center text-[13px]">
                {current.caption}
                <span className="tnum ml-2 text-white/60">
                  {(open ?? 0) + 1} / {photos.length}
                </span>
              </p>
              <button
                type="button"
                onClick={() => step(1)}
                className="rounded px-3 py-1.5 text-[13px] hover:bg-white/10"
                aria-label="Next photograph"
              >
                Next ›
              </button>
            </div>
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={close}
                className="rounded border border-white/30 px-3 py-1 text-[12px] hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
