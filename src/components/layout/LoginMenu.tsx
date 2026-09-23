'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { getStudentSessionSummary, studentSignOut } from '@/lib/store'
import {
  announceStudentSessionChanged,
  onStudentSessionChanged,
} from '@/lib/student-session-events'

/**
 * The masthead account menu.
 *
 * Signed out: "Login ▾" → Student Login / JNU Login (staff).
 * Signed in as a student: "<Name> ▾" → My Profile / My Results / Sign out.
 *
 * It starts in the signed-out state and switches once the session check
 * returns. That is the right default: the button sits on every page for every
 * visitor, and nearly all of them are not signed in. Starting from a blank or
 * a spinner would make every visitor on every page wait on a network call to
 * render a login button.
 *
 * Click-opened rather than hover-opened, unlike the main nav: this is a
 * destination people deliberately reach for, and a hover menu is easy to
 * trigger by accident and unusable on touch.
 *
 * All targets are noindex and disallowed in robots.txt, so linking them from
 * every page costs nothing in the index.
 */

type Student = { rollNo: string; fullName: string }

const signedOutItems = [
  { href: '/student/login/', label: 'Student Login', hint: 'Results and candidate details' },
  { href: '/admin/login/', label: 'JNU Login', hint: 'Staff and administration' },
]

const signedInItems = [
  { href: '/student/', label: 'My Profile', hint: 'Details, photograph and contact' },
  { href: '/results/', label: 'My Results', hint: 'Published examination results' },
]

/** "Rajesh Kumar Meena" → "Rajesh". Keeps the masthead button a sane width. */
function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full
}

export function LoginMenu() {
  const [open, setOpen] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const refreshSession = useCallback(async () => {
    setStudent(await getStudentSessionSummary())
  }, [])

  useEffect(() => {
    void refreshSession()
    // Sign-in and sign-out on the portal page update this button too.
    return onStudentSessionChanged(() => void refreshSession())
  }, [refreshSession])

  // Close on a click anywhere outside, and on Escape. Without the first the
  // menu stays open behind whatever the person clicks next; without the
  // second a keyboard user who opens it has no way back out.
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

  async function signOut() {
    setOpen(false)
    await studentSignOut()
    setStudent(null)
    announceStudentSessionChanged()
    // Leave the student pages rather than strand the person on a portal
    // screen that has just become a login form.
    if (pathname?.startsWith('/student') || pathname?.startsWith('/results')) {
      router.push('/')
    }
  }

  const items = student ? signedInItems : signedOutItems

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="login-menu"
        // The full name goes in the accessible label; the visible text is the
        // first name only, so a long name does not push the masthead onto
        // two lines.
        aria-label={student ? `Account menu for ${student.fullName}` : undefined}
        className="btn btn-primary inline-flex max-w-[200px] items-center gap-1.5 max-sm:px-2.5 max-sm:text-[11px]"
      >
        {student ? (
          <>
            <span
              aria-hidden="true"
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-[10px] font-bold"
            >
              {firstName(student.fullName).charAt(0).toUpperCase()}
            </span>
            <span className="truncate normal-case tracking-normal">
              {firstName(student.fullName)}
            </span>
          </>
        ) : (
          'Login'
        )}
        <span aria-hidden="true" className="text-[9px] leading-none">
          ▾
        </span>
      </button>

      {/* Rendered only when open. A hidden-but-present menu would put its links
          in the tab order on every page. */}
      {open ? (
        <div
          id="login-menu"
          role="menu"
          aria-label={student ? 'Account' : 'Login'}
          className="absolute right-0 top-full z-50 mt-1 w-64 max-w-[calc(100vw-2rem)] border border-hair bg-white shadow-chrome"
        >
          {student ? (
            <div className="border-b border-hair bg-shell px-4 py-2.5">
              <span className="block text-[13px] font-semibold text-jnu-800">
                {student.fullName}
              </span>
              <span className="tnum block text-[11px] text-muted">{student.rollNo}</span>
            </div>
          ) : null}

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
            {student ? (
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#a8322b] hover:bg-shell"
                >
                  Sign out
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
