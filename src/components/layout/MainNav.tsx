'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { MenuItem } from '@/lib/content-types'

/**
 * Hover-opened dropdowns, era-correct — but keyboard and touch accessible,
 * which the original was not. `focus-within` in globals.css keeps the panel
 * open for keyboard users; the mobile disclosure below handles touch.
 */
export function MainNav({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <nav aria-label="Main" className="chrome-nav">
      <div className="boxed">
        {/* ---- mobile toggle ---- */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="main-nav-list"
          className="my-2 flex items-center gap-2 rounded border border-jnu-300/40 px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-white lg:hidden"
        >
          <span aria-hidden="true">{open ? '×' : '☰'}</span> Menu
        </button>

        <ul
          id="main-nav-list"
          className={`${open ? 'block' : 'hidden'} lg:flex lg:flex-wrap lg:items-stretch`}
        >
          {items.map((item) => (
            // `relative` at every breakpoint on purpose: the panel below is
            // absolutely positioned with top-full, so this <li> has to be its
            // containing block. With `lg:static` here the panel resolved
            // against the document instead and dropped a full page height.
            <li key={item.href} className="nav-item relative">
              <Link
                href={item.href}
                className="block px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white no-underline hover:bg-jnu-700 hover:text-white lg:py-3"
              >
                {item.label}
                {item.children ? (
                  <span className="ml-1.5 text-[9px]" aria-hidden="true">
                    ▾
                  </span>
                ) : null}
              </Link>

              {item.children ? (
                <div className="nav-panel lg:absolute lg:left-0 lg:top-full lg:z-40 lg:w-64">
                  <ul className="border-hair bg-white lg:border lg:shadow-chrome">
                    {item.children.map((child) => (
                      <li key={child.href} className="border-b border-hair last:border-b-0">
                        <Link
                          href={child.href}
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
  )
}
