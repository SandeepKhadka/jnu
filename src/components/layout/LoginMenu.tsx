'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/**
 * The masthead Login dropdown: Student Login and JNU Login (staff).
 *
 * Click-opened rather than hover-opened, unlike the main nav. A hover menu is
 * fine for browsing sections, but this one is a destination people are
 * deliberately reaching for, and a menu that opens when the pointer merely
 * crosses it is easy to trigger by accident and impossible to use on touch.
 *
 * Both targets are noindex and disallowed in robots.txt, so linking them from
 * every page costs nothing in the index.
 */

const items = [
  {
    href: '/student/login/',
    label: 'Student Login',
    hint: 'Results and candidate details',
  },
  {
    href: '/admin/login/',
    label: 'JNU Login',
    hint: 'Staff and administration',
  },
]

export function LoginMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on a click anywhere outside, and on Escape. Without the first, the
  // menu stays open behind whatever the person clicks next; without the
  // second, a keyboard user who opens it has no way back out.
  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        // Return focus to the trigger, or the tab order restarts at the top.
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="login-menu"
        className="btn btn-primary inline-flex items-center gap-1.5"
      >
        Login
        <span aria-hidden="true" className="text-[9px] leading-none">
          ▾
        </span>
      </button>

      {/* Rendered only when open. A hidden-but-present menu would put both
          links in the tab order on every page. */}
      {open ? (
        <div
          id="login-menu"
          role="menu"
          aria-label="Login"
          className="absolute right-0 top-full z-50 mt-1 w-60 border border-hair bg-white shadow-chrome"
        >
          <ul className="m-0 list-none p-0">
            {items.map((item) => (
              <li key={item.href} className="border-b border-hair last:border-b-0">
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 no-underline hover:bg-shell"
                >
                  <span className="block text-[13px] font-semibold text-jnu-800">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-muted">{item.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
