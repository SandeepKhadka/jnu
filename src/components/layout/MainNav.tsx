'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { MenuItem } from '@/lib/content-types'

/**
 * The desktop menu bar. Hidden below xl, where MobileBar takes over — eleven
 * top-level items do not fit a 1210px row at tablet width, and a drawer reads
 * better there than a bar wrapped onto two lines.
 *
 * Hover-opened dropdowns, era-correct, and keyboard reachable: globals.css
 * opens `.nav-panel` on :hover and :focus-within, both scoped to lg and up.
 *
 * The one thing CSS cannot do here is shut the panel after a link inside it is
 * followed. Next navigates without a page load, so the pointer never leaves
 * the panel, :hover still matches, and the menu stays open on top of the page
 * the reader just chose. So: on every path change we suppress the panel, and
 * release it again the moment the pointer actually moves. Hovering still opens
 * it as before — this only covers the instant after a click.
 */
export function MainNav({ items }: { items: MenuItem[] }) {
  const pathname = usePathname()
  const [justNavigated, setJustNavigated] = useState(false)

  useEffect(() => {
    setJustNavigated(true)
    // :focus-within would hold the panel open on its own, and after a
    // client-side navigation the clicked link keeps focus.
    const active = document.activeElement
    if (active instanceof HTMLElement && active.closest('.nav-panel')) active.blur()

    const release = () => setJustNavigated(false)
    // `once` on both: the first real pointer move or key press hands control
    // back to the ordinary hover rules.
    window.addEventListener('pointermove', release, { once: true })
    window.addEventListener('keydown', release, { once: true })
    return () => {
      window.removeEventListener('pointermove', release)
      window.removeEventListener('keydown', release)
    }
  }, [pathname])

  // Tighter padding and letter-spacing than the rest of the chrome, so eleven
  // top-level items stay on one row. The container is capped at 1210px
  // (max-w-boxed) whatever the screen width, so this cannot be solved by
  // assuming a wide monitor — at the previous spacing the items needed 1317px
  // and Career and Contact dropped to a second line on every size. A menu bar
  // that wraps reads as broken rather than as a design.
  const itemLink =
    'block px-2.5 py-3 text-[13px] font-semibold uppercase tracking-[0.02em] text-white no-underline hover:bg-jnu-700 hover:text-white lg:py-4'

  return (
    <nav
      aria-label="Main"
      className={`chrome-nav hidden xl:block ${justNavigated ? 'nav-just-navigated' : ''}`}
    >
      <div className="boxed">
        <ul className="flex flex-wrap items-stretch">
          {items.map((item) => (
            // `relative` because the panel is absolutely positioned with
            // top-full, so this <li> has to be its containing block. With
            // `static` here the panel resolved against the document instead
            // and dropped a full page height.
            <li key={item.href} className="nav-item relative">
              <Link href={item.href} className={itemLink}>
                {item.label}
                {item.children ? (
                  <span className="ml-1.5 text-[9px]" aria-hidden="true">
                    {'▾'}
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
                          className="block bg-white px-4 py-2 text-[12px] text-jnu-700 no-underline hover:bg-shell hover:text-jnu-800"
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
