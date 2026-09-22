'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/lib/content-types'

/**
 * The main menu.
 *
 * Two behaviours from one markup, because touch and pointer want opposite
 * things:
 *
 *   lg and up — hover-opened dropdowns, era-correct, keyboard reachable via
 *   :focus-within (globals.css). Not sticky; unchanged from the original.
 *
 *   below lg — the bar sticks to the top and gets out of the way: scrolling
 *   DOWN slides it off, scrolling UP brings it straight back. The menu is
 *   always one swipe away without a button parked permanently over the
 *   content. A section with children is a BUTTON, not a link: tapping
 *   "Admission" used to follow the link and load the page while the panel
 *   flashed open above it, leaving the menu apparently stuck open over
 *   content that had already changed.
 *
 * Choosing anything closes the drawer. The nav lives in the layout, so React
 * keeps this mounted across client navigations — without an explicit close
 * the menu stayed open over every page you picked.
 */
export function MainNav({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  // Scroll DIRECTION, not scroll position. The small threshold keeps the bar
  // still during the jitter of a finger resting on a moving page, and the
  // 80px floor stops it flickering around the top of the document.
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

  const itemLink =
    'block px-4 py-3 text-[13.5px] font-semibold uppercase tracking-[0.06em] text-white no-underline hover:bg-jnu-700 hover:text-white lg:py-4'

  return (
    <>
      {/* Scrim. Tapping outside the drawer closes it. */}
      {open ? (
        <div aria-hidden="true" onClick={close} className="fixed inset-0 z-[60] bg-black/50 lg:hidden" />
      ) : null}

      <nav
        aria-label="Main"
        className={`chrome-nav sticky top-0 z-50 transition-transform duration-200 motion-reduce:transition-none lg:static lg:translate-y-0 ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="boxed">
          {/* The menu button rides along in the sticky bar. */}
          <div className="flex items-center justify-end lg:hidden">
            <button
              type="button"
              onClick={() => (open ? close() : setOpen(true))}
              aria-expanded={open}
              aria-controls="main-nav-list"
              className="my-2 flex items-center gap-2 rounded border border-white/30 px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-white"
            >
              <span aria-hidden="true">{open ? '×' : '☰'}</span> Menu
            </button>
          </div>

          <ul
            id="main-nav-list"
            className={
              open
                ? 'fixed inset-y-0 right-0 z-[65] w-[min(20rem,88vw)] overflow-y-auto overscroll-contain bg-jnu-600 pb-8 pt-3 shadow-chrome lg:static lg:z-auto lg:flex lg:w-auto lg:flex-wrap lg:items-stretch lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none'
                : 'hidden lg:flex lg:flex-wrap lg:items-stretch'
            }
          >
            {/*
              A close control inside the drawer. The sticky bar that opened it
              may have scrolled off, so its button cannot be relied on.
            */}
            {open ? (
              <li className="flex justify-end px-3 pb-2 lg:hidden">
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
              // `relative` at every breakpoint on purpose: the panel below is
              // absolutely positioned with top-full, so this <li> has to be its
              // containing block. With `lg:static` here the panel resolved
              // against the document instead and dropped a full page height.
              <li key={item.href} className="nav-item relative">
                {item.children ? (
                  <>
                    {/* Phone: opens the section. Never navigates. */}
                    <button
                      type="button"
                      onClick={() => setSection((s) => (s === item.href ? null : item.href))}
                      aria-expanded={section === item.href}
                      className={`${itemLink} flex w-full items-center justify-between text-left lg:hidden`}
                    >
                      {item.label}
                      <span aria-hidden="true" className="ml-2 text-[10px]">
                        {section === item.href ? '▴' : '▾'}
                      </span>
                    </button>

                    {/* lg and up: the label is the section's own page. */}
                    <Link href={item.href} className={`hidden lg:block ${itemLink}`}>
                      {item.label}
                      <span className="ml-1.5 text-[9px]" aria-hidden="true">
                        {'▾'}
                      </span>
                    </Link>
                  </>
                ) : (
                  <Link href={item.href} onClick={close} className={itemLink}>
                    {item.label}
                  </Link>
                )}

                {item.children ? (
                  <div
                    className={`nav-panel ${section === item.href ? 'is-open' : ''} lg:absolute lg:left-0 lg:top-full lg:z-40 lg:w-64`}
                  >
                    <ul className="border-hair bg-white lg:border lg:shadow-chrome">
                      {/*
                        The section's own page. On a phone the label above is a
                        toggle, so without this row /admission/ would have no
                        way in at all.
                      */}
                      <li className="border-b border-hair last:border-b-0 lg:hidden">
                        <Link
                          href={item.href}
                          onClick={close}
                          className="block bg-jnu-800 px-6 py-2 text-[12px] font-semibold uppercase tracking-wide text-white no-underline"
                        >
                          {item.label} overview
                        </Link>
                      </li>
                      {item.children.map((child) => (
                        <li key={child.href} className="border-b border-hair last:border-b-0">
                          <Link
                            href={child.href}
                            onClick={close}
                            className="block bg-jnu-700 px-6 py-2 text-[12px] text-white no-underline hover:bg-jnu-800 lg:bg-white lg:px-4 lg:text-jnu-700 lg:hover:bg-shell lg:hover:text-jnu-800"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  )
}
