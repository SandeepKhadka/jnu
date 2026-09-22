'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/lib/content-types'

/**
 * The main menu.
 *
 * Below lg the bar is FIXED and follows scroll direction: scrolling down
 * slides it away, scrolling up brings it back. It is fixed rather than
 * sticky because a sticky element only sticks inside its own parent's box —
 * the bar lives at the bottom of <header>, so it unstuck the moment the
 * masthead scrolled past and never came back.
 *
 * The bar, the drawer and the desktop nav are three separate elements on
 * purpose. The bar is the only one that gets a transform, and a transformed
 * element becomes the containing block for any `position: fixed` inside it:
 * with the drawer nested in the bar it was being laid out against a 52px-tall
 * strip instead of the viewport, which is why opening the menu showed a
 * sliver with nothing but the close button in it.
 *
 * From lg up: hover-opened dropdowns, era-correct, keyboard reachable via
 * :focus-within (globals.css), and not fixed at all.
 */
export function MainNav({ items, utility }: { items: MenuItem[]; utility?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const barRef = useRef<HTMLDivElement>(null)
  const [barH, setBarH] = useState(0)

  // The strip is out of the flow, so something has to hold its place, and
  // its height is not fixed — the contact details wrap on a narrow screen.
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBarH(el.offsetHeight))
    ro.observe(el)
    setBarH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  // Scroll DIRECTION, not position. The threshold keeps the bar still under
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

  const itemLink =
    'block px-4 py-3 text-[13.5px] font-semibold uppercase tracking-[0.06em] text-white no-underline hover:bg-jnu-700 hover:text-white lg:py-4'

  /** The same tree in the drawer and in the desktop bar. */
  const renderItems = () =>
    items.map((item) => (
      // `relative` at every breakpoint on purpose: the desktop panel is
      // absolutely positioned with top-full, so this <li> has to be its
      // containing block.
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
                The section's own page. On a phone the label above is a toggle,
                so without this row /admission/ would have no way in at all.
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
    ))

  return (
    <>
      {/*
        Phone: the info strip IS the bar, with the menu button at its right.
        One element at the top of the page rather than a menu bar laid over
        the contact details. It is the only element carrying a transform.
      */}
      <div
        ref={barRef}
        className={`chrome-topbar fixed inset-x-0 top-0 z-50 text-white transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
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
            aria-controls="main-nav-list"
            className="flex shrink-0 items-center gap-1.5 rounded border border-white/30 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-white"
          >
            <span aria-hidden="true">{open ? '×' : '☰'}</span> Menu
          </button>
        </div>
      </div>
      {/* Holds the strip's place in the flow, since it is out of it. */}
      <div aria-hidden="true" className="lg:hidden" style={{ height: barH }} />

      {/* ---- phone: scrim and drawer, outside anything transformed ---- */}
      {open ? (
        <div aria-hidden="true" onClick={close} className="fixed inset-0 z-[60] bg-black/50 lg:hidden" />
      ) : null}

      <nav aria-label="Main menu" className="lg:hidden">
        <ul
          id="main-nav-list"
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
          {renderItems()}
        </ul>
      </nav>

      {/* ---- lg and up: unchanged ---- */}
      <nav aria-label="Main" className="chrome-nav hidden lg:block">
        <div className="boxed">
          <ul className="flex flex-wrap items-stretch">{renderItems()}</ul>
        </div>
      </nav>
    </>
  )
}
