import Link from 'next/link'
import type { MenuItem } from '@/lib/content-types'

/**
 * The desktop menu bar. Hidden below lg, where MobileBar takes over.
 *
 * Hover-opened dropdowns, era-correct, and keyboard reachable: globals.css
 * opens `.nav-panel` on :hover and :focus-within, both scoped to lg and up.
 * That is the whole behaviour, so this needs no state and stays a server
 * component — the phone's drawer is the only part that needed JavaScript.
 */
export function MainNav({ items }: { items: MenuItem[] }) {
  const itemLink =
    'block px-4 py-3 text-[13.5px] font-semibold uppercase tracking-[0.06em] text-white no-underline hover:bg-jnu-700 hover:text-white lg:py-4'

  return (
    <nav aria-label="Main" className="chrome-nav hidden lg:block">
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
