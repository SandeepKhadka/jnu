'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/lib/content-types'

/**
 * The phone header: the contact strip, the menu button inside it, and the
 * drawer they open.
 *
 * Rendered FIRST in the header, before the masthead. The strip is fixed at
 * top:0, so whatever holds its place in the flow has to be the first thing on
 * the page; when that reservation sat after the masthead, the strip covered
 * the logo no matter how the height was worked out.
 *
 * The strip is rendered twice. The first copy stays in the flow and is
 * invisible, reserving exactly the height the real one occupies, at every
 * width, with no JavaScript and no shift on first paint. `visibility: hidden`
 * also takes it out of the tab order, so the duplicated links cannot be
 * focused.
 *
 * Fixed rather than sticky: a sticky element only sticks inside its own
 * parent's box, so anything inside <header> comes unstuck the moment the
 * header scrolls past. The strip, the drawer and the scrim are siblings
 * because a transformed element becomes the containing block for any
 * `position: fixed` inside it — with the drawer nested in the strip it laid
 * out against a 50px band instead of the viewport.
 */
export function MobileBar({ items, utility }: { items: MenuItem[]; utility?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  // Scroll DIRECTION, not position. The threshold keeps the strip still under
  // the jitter of a finger resting on a moving page; the 80px floor stops it
  // flickering around the top of the document.
  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      if (open || y < 80) setHidden(false)
      else if (delta > 6) setHidden(true)
      else if (delta < -6) setHidden(false)
      if (Math.abs(delta) > 6) lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open])

  // The drawer covers the page; letting the body scroll behind it is how a
  // mobile menu ends up scrolled somewhere unexpected by the time it closes.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setSection(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function close() {
    setOpen(false)
    setSection(null)
  }

  const stripInner = (
    <div className="boxed flex items-start justify-between gap-3 py-1.5 text-xs">
      <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">{utility}</div>
      <button
        type="button"
        onClick={() => {
          if (open) close()
          else {
            setHidden(false)
            setOpen(true)
          }
        }}
        aria-expanded={open}
        aria-controls="mobile-nav-list"
        className="flex shrink-0 items-center gap-1.5 rounded border border-white/30 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-white"
      >
        <span aria-hidden="true">{open ? '×' : '☰'}</span> Menu
      </button>
    </div>
  )

  const itemLink =
    'block px-4 py-3 text-[13.5px] font-semibold uppercase tracking-[0.06em] text-white no-underline'

  return (
    <div className="lg:hidden">
      {/* Holds the strip's place in the flow. Must precede the masthead. */}
      <div aria-hidden="true" className="invisible">
        {stripInner}
      </div>

      <div
        className={`chrome-topbar fixed inset-x-0 top-0 z-50 text-white transition-transform duration-200 motion-reduce:transition-none ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {stripInner}
      </div>

      {open ? <div aria-hidden="true" onClick={close} className="fixed inset-0 z-[60] bg-black/50" /> : null}

      <nav aria-label="Main menu">
        <ul
          id="mobile-nav-list"
          className={
            open
              ? 'fixed inset-y-0 right-0 z-[65] w-[min(20rem,88vw)] overflow-y-auto overscroll-contain bg-jnu-600 pb-8 pt-3 shadow-chrome'
              : 'hidden'
          }
        >
          {open ? (
            <li className="flex justify-end px-3 pb-2">
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="rounded border border-white/30 px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-white"
              >
                <span aria-hidden="true">{'×'}</span> Close
              </button>
            </li>
          ) : null}

          {items.map((item) => (
            <li key={item.href}>
              {item.children ? (
                <>
                  {/*
                    A button, not a link. Tapping "Admission" used to follow
                    the link and load the page while the panel flashed open
                    above it, leaving the menu apparently stuck open over
                    content that had already changed.
                  */}
                  <button
                    type="button"
                    onClick={() => setSection((s) => (s === item.href ? null : item.href))}
                    aria-expanded={section === item.href}
                    className={`${itemLink} flex w-full items-center justify-between text-left`}
                  >
                    {item.label}
                    <span aria-hidden="true" className="ml-2 text-[10px]">
                      {section === item.href ? '▴' : '▾'}
                    </span>
                  </button>

                  {section === item.href ? (
                    <ul>
                      {/*
                        The section's own page. The label above is a toggle, so
                        without this row /admission/ would have no way in.
                      */}
                      <li>
                        <Link
                          href={item.href}
                          onClick={close}
                          className="block bg-jnu-800 px-6 py-2 text-[12px] font-semibold uppercase tracking-wide text-white no-underline"
                        >
                          {item.label} overview
                        </Link>
                      </li>
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={close}
                            className="block bg-jnu-700 px-6 py-2 text-[12px] text-white no-underline"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <Link href={item.href} onClick={close} className={itemLink}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
