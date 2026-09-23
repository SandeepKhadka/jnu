'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { api } from '@/lib/admin-client'
import { can, roleLabel, type Permission, type Role } from '@/lib/permissions'
import { Icon, type IconName } from '@/components/admin/icons'

/**
 * The admin panel's chrome: sidebar, current user, sign out.
 *
 * The sidebar is built from the same permission table the API enforces, so a
 * member of staff is never shown a section that would refuse them. Hiding a
 * link is a convenience, not the control — every route checks again.
 *
 * It collapses to an icon rail. On a 1366×768 laptop — which is what most
 * university offices actually have — 240px of permanent navigation is a tenth
 * of the screen, and the registrar working through a list of students wants it
 * back. The choice is remembered per browser.
 */

type Item = { href: string; label: string; icon: IconName; permission?: Permission }
type Group = { title: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: 'Website',
    items: [
      { href: '/admin/homepage', label: 'Homepage', icon: 'home', permission: 'content.edit' },
      { href: '/admin/carousel', label: 'Carousel', icon: 'carousel', permission: 'content.edit' },
      { href: '/admin/pages', label: 'Pages', icon: 'pages', permission: 'content.edit' },
      { href: '/admin/programmes', label: 'Faculties & programmes', icon: 'programmes', permission: 'programmes.edit' },
      { href: '/admin/notices', label: 'Notices', icon: 'notices', permission: 'content.edit' },
      { href: '/admin/gallery', label: 'Photo gallery', icon: 'gallery', permission: 'content.edit' },
      { href: '/admin/menu', label: 'Menus', icon: 'menu', permission: 'content.edit' },
      { href: '/admin/documents', label: 'Affiliations & syllabus', icon: 'pages', permission: 'content.edit' },
      { href: '/admin/popup', label: 'Pop-up notice', icon: 'notices', permission: 'content.edit' },
      { href: '/admin/media', label: 'Media library', icon: 'media', permission: 'content.edit' },
    ],
  },
  {
    title: 'Students & records',
    items: [
      { href: '/admin/students', label: 'Students', icon: 'students', permission: 'students.view' },
      { href: '/admin/results', label: 'Results', icon: 'results', permission: 'results.manage' },
      { href: '/admin/certificates', label: 'Degrees', icon: 'degrees', permission: 'certificates.view' },
      { href: '/admin/requests', label: 'Student requests', icon: 'requests', permission: 'reviews.photos' },
    ],
  },
  {
    title: 'Admissions',
    items: [
      { href: '/admin/applications', label: 'Applications', icon: 'applications', permission: 'applications.manage' },
      { href: '/admin/enquiries', label: 'Enquiries', icon: 'enquiries', permission: 'enquiries.manage' },
      { href: '/admin/counselling', label: 'Online counselling', icon: 'enquiries', permission: 'counselling.manage' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Site details', icon: 'settings', permission: 'content.edit' },
      { href: '/admin/branding', label: 'Logo & branding', icon: 'branding', permission: 'branding.edit' },
      { href: '/admin/recognition', label: 'Recognition', icon: 'recognition', permission: 'recognition.edit' },
      { href: '/admin/examinations', label: 'Examinations', icon: 'examinations', permission: 'exams.settings' },
      { href: '/admin/staff', label: 'Staff accounts', icon: 'staff', permission: 'staff.manage' },
      { href: '/admin/audit', label: 'Audit log', icon: 'audit', permission: 'audit.view' },
    ],
  },
]

const COLLAPSE_KEY = 'jnu.admin.railed'

/** Initials for the avatar: "Sunita Rathore" → SR. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export function AdminShell({
  user,
  children,
}: {
  user: { fullName: string; email: string; role: Role }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawer, setDrawer] = useState(false) // phone/tablet slide-over
  const [railed, setRailed] = useState(false) // desktop icon-only rail

  // Read the stored preference after mount: reading it during render would
  // make the server and client markup disagree. localStorage can throw in a
  // locked-down browser, so a failure just leaves the sidebar expanded.
  useEffect(() => {
    try {
      setRailed(window.localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {
      /* no stored preference available; the default stands */
    }
  }, [])

  function toggleRail() {
    setRailed((v) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1')
      } catch {
        /* preference simply will not persist */
      }
      return !v
    })
  }

  // Close the drawer on navigation, so tapping a link on a phone reveals the
  // page rather than leaving the menu covering it.
  useEffect(() => {
    setDrawer(false)
  }, [pathname])

  async function signOut() {
    await api('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login/')
    router.refresh()
  }

  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.permission || can(user.role, i.permission)),
  })).filter((g) => g.items.length)

  const onDashboard = pathname === '/admin' || pathname === '/admin/'
  const current =
    groups.flatMap((g) => g.items).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.label ??
    (onDashboard ? 'Dashboard' : '')

  const railWidth = railed ? 'lg:w-[68px]' : 'lg:w-[248px]'

  return (
    <div className="min-h-screen bg-[#eef1f5]">
      {/* ------------------------------------------------------- sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-gradient-to-b from-[#123f63] via-[#10395a] to-[#0d2f4a] text-white shadow-[4px_0_24px_rgba(13,47,74,.18)] transition-[width,transform] duration-200 ease-out ${railWidth} ${
          drawer ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Wordmark */}
        <div className={`flex h-[60px] shrink-0 items-center gap-2.5 border-b border-white/10 ${railed ? 'lg:justify-center lg:px-0' : ''} px-4`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 font-display text-[13px] font-semibold tracking-tight">
            JNU
          </span>
          <span className={`min-w-0 ${railed ? 'lg:hidden' : ''}`}>
            <span className="block truncate font-display text-[13.5px] uppercase leading-tight tracking-wide">
              Administration
            </span>
            <span className="block truncate text-[11px] leading-tight text-white/55">Jodhpur National University</span>
          </span>
        </div>

        {/* Navigation */}
        <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <NavLink href="/admin" icon="dashboard" label="Dashboard" active={onDashboard} railed={railed} />

          {groups.map((g) => (
            <div key={g.title} className="mt-5">
              {/* Collapsed, the heading becomes a rule: a three-letter stub of
                  "Students & records" would say less than nothing. */}
              {railed ? (
                <div className="mx-2 mb-2 hidden border-t border-white/10 lg:block" />
              ) : null}
              <h2
                className={`mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-white/45 ${
                  railed ? 'lg:hidden' : ''
                }`}
              >
                {g.title}
              </h2>
              <ul className="m-0 list-none space-y-0.5 p-0">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <NavLink
                      href={i.href}
                      icon={i.icon}
                      label={i.label}
                      active={pathname === i.href || pathname.startsWith(`${i.href}/`)}
                      railed={railed}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: view the live site, and the collapse control */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title="View website"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/70 no-underline transition-colors hover:bg-white/10 hover:text-white ${
              railed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Icon name="external" />
            <span className={railed ? 'lg:hidden' : ''}>View website</span>
          </a>
          <button
            type="button"
            onClick={toggleRail}
            aria-label={railed ? 'Expand the sidebar' : 'Collapse the sidebar'}
            title={railed ? 'Expand the sidebar' : 'Collapse the sidebar'}
            className={`mt-1 hidden w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2 text-[13px] text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:flex ${
              railed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Icon name="chevron" className={`transition-transform duration-200 ${railed ? '' : 'rotate-180'}`} />
            <span className={railed ? 'lg:hidden' : ''}>Collapse</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for the phone drawer */}
      {drawer ? (
        <button
          type="button"
          aria-label="Close the menu"
          onClick={() => setDrawer(false)}
          className="fixed inset-0 z-30 border-0 bg-[#0d2f4a]/45 p-0 lg:hidden"
        />
      ) : null}

      {/* --------------------------------------------------------- content */}
      <div className={`transition-[padding] duration-200 ease-out ${railed ? 'lg:pl-[68px]' : 'lg:pl-[248px]'}`}>
        <header className="sticky top-0 z-20 border-b border-[#dde3ea] bg-white/85 backdrop-blur">
          <div className="flex h-[60px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dde3ea] bg-white text-jnu-800 transition-colors hover:bg-shell lg:hidden"
                onClick={() => setDrawer(true)}
                aria-label="Open the menu"
              >
                <Icon name="menu" size={18} />
              </button>
              {/* Where you are, which is the one thing an icon rail takes
                  away. Deliberately not a heading — the page below has the
                  real <h1>, and two would compete. */}
              <span className="truncate font-display text-[16px] text-jnu-800">{current}</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/account"
                title="Your account"
                aria-label={`Your account — ${user.fullName}`}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 no-underline transition-colors hover:bg-shell sm:pr-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jnu-700 text-[12px] font-semibold text-white">
                  {initials(user.fullName)}
                </span>
                <span className="hidden min-w-0 leading-tight sm:block">
                  <span className="block truncate text-[13px] font-semibold text-jnu-800">{user.fullName}</span>
                  <span className="block truncate text-[11px] text-muted">{roleLabel(user.role)}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#dde3ea] bg-white text-muted transition-colors hover:border-[#c9a0a0] hover:bg-[#a8322b]/[0.06] hover:text-[#a8322b]"
              >
                <Icon name="signout" size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

/**
 * One sidebar link.
 *
 * Collapsed, the label is hidden but still in the DOM rather than removed, so
 * a screen reader keeps reading the link normally; `title` gives the mouse the
 * same text as a tooltip.
 */
function NavLink({
  href,
  icon,
  label,
  active,
  railed,
}: {
  href: string
  icon: IconName
  label: string
  active: boolean
  railed: boolean
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] no-underline transition-colors ${
        railed ? 'lg:justify-center lg:px-0' : ''
      } ${
        active
          ? 'bg-white/15 font-semibold text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      {/* The active marker is a bar on the rail edge, which survives the
          collapse — a highlight alone is hard to place when the pill is only
          an icon wide. */}
      {active ? (
        <span aria-hidden="true" className="absolute inset-y-1.5 -left-3 w-[3px] rounded-r bg-white" />
      ) : null}
      <Icon name={icon} className="shrink-0" />
      <span className={`truncate ${railed ? 'lg:hidden' : ''}`}>{label}</span>
    </Link>
  )
}
