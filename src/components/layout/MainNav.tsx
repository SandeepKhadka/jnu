'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { MenuItem } from '@/lib/content-types'

/**
 * The main menu.
 *
 * Two behaviours from one markup, because touch and pointer want opposite
 * things:
 *
 *   lg and up — hover-opened dropdowns, era-correct, keyboard reachable via
 *   :focus-within (globals.css).
 *
 *   below lg — a drawer. A section with children is a BUTTON, not a link:
 *   tapping "Admission" used to follow the link and load the page while the
 *   panel flashed open above it, so the menu appeared stuck open over content
 *   that had already changed. Now it opens the section, and the section's own
 *   page is the first entry inside it, so that page is still reachable.
 *
 * Choosing anything closes the whole drawer. The nav lives in the layout, so
 * React keeps this component mounted across client navigations — without an
 * explicit close the menu stayed open over every page you picked.
 */
export function MainNav({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<string | null>(null)

  // The drawer is fixed and covers the page; letting the body scroll behind it
  // is the usual way a mobile menu ends up scrolled to somewhere unexpected.
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    setOpen(false)
    setSection(null)
  }

  const itemLink =
    'block px-4 py-3 text-[13.5px] font-semibold uppercase tracking-[0.06em] text-white no-underline hover:bg-jnu-700 hover:text-white lg:py-4'

  return (
    <>
      {/*
        Fixed, top right, above everything. The menu used to sit in the flow of
        the nav bar, which on a phone meant scrolling back to the top of the
        page to change section.
      */}
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="main-nav-list"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="fixed right-3 top-3 z-[70] flex items-center gap-2 rounded border border-white/30 bg-jnu-800 px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-white shadow-chrome lg:hidden"
      >
        <span aria-hidden="true" className="text-[15px] leading-none">
          {open ? '\u00d7' : '\u2630'}
        </span>
        Menu
      </button>

      {/* Scrim. Tapping outside the drawer closes it. */}
      {open ? (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
        />
      ) : null}

      <nav aria-label="Main" className="chrome-nav">
        <div className="boxed">
          <ul
            id="main-nav-list"
            className={
              open
                ? 'fixed inset-y-0 right-0 z-[65] w-[min(20rem,88vw)] overflow-y-auto overscroll-contain bg-jnu-600 pb-8 pt-16 shadow-chrome lg:static lg:z-auto lg:flex lg:w-auto lg:flex-wrap lg:items-stretch lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none'
                : 'hidden lg:flex lg:flex-wrap lg:items-stretch'
            }
          >
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
                        {section === item.href ? '\u25b4' : '\u25be'}
                      </span>
                    </button>

                    {/* lg and up: the label is the section's own page. */}
                    <Link href={item.href} className={`hidden lg:block ${itemLink}`}>
                      {item.label}
                      <span className="ml-1.5 text-[9px]" aria-hidden="true">
                        {'\u25be'}
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
