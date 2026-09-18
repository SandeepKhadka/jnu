'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { api } from '@/lib/admin-client'
import { can, roleLabel, type Permission, type Role } from '@/lib/permissions'

/**
 * The admin panel's chrome: sidebar, current user, sign out.
 *
 * The sidebar is built from the same permission table the API enforces, so a
 * member of staff is never shown a section that would refuse them. Hiding a
 * link is a convenience, not the control — every route checks again.
 */

type Item = { href: string; label: string; permission?: Permission }
type Group = { title: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: 'Website',
    items: [
      { href: '/admin/homepage', label: 'Homepage', permission: 'content.edit' },
      { href: '/admin/carousel', label: 'Carousel', permission: 'content.edit' },
      { href: '/admin/pages', label: 'Pages', permission: 'content.edit' },
      { href: '/admin/programmes', label: 'Faculties & programmes', permission: 'programmes.edit' },
      { href: '/admin/notices', label: 'Notices', permission: 'content.edit' },
      { href: '/admin/gallery', label: 'Photo gallery', permission: 'content.edit' },
      { href: '/admin/menu', label: 'Menus', permission: 'content.edit' },
      { href: '/admin/media', label: 'Media library', permission: 'content.edit' },
    ],
  },
  {
    title: 'Students & records',
    items: [
      { href: '/admin/students', label: 'Students', permission: 'students.view' },
      { href: '/admin/results', label: 'Results', permission: 'results.manage' },
      { href: '/admin/certificates', label: 'Degrees', permission: 'certificates.view' },
      { href: '/admin/requests', label: 'Student requests', permission: 'reviews.photos' },
    ],
  },
  {
    title: 'Admissions',
    items: [
      { href: '/admin/applications', label: 'Applications', permission: 'applications.manage' },
      { href: '/admin/enquiries', label: 'Enquiries', permission: 'enquiries.manage' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Site details', permission: 'content.edit' },
      { href: '/admin/branding', label: 'Logo & branding', permission: 'branding.edit' },
      { href: '/admin/recognition', label: 'Recognition', permission: 'recognition.edit' },
      { href: '/admin/examinations', label: 'Examinations', permission: 'exams.settings' },
      { href: '/admin/staff', label: 'Staff accounts', permission: 'staff.manage' },
      { href: '/admin/audit', label: 'Audit log', permission: 'audit.view' },
    ],
  },
]

export function AdminShell({
  user,
  children,
}: {
  user: { fullName: string; email: string; role: Role }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await api('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login/')
    router.refresh()
  }

  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.permission || can(user.role, i.permission)),
  })).filter((g) => g.items.length)

  return (
    <div className="min-h-screen bg-shell">
      <header className="sticky top-0 z-30 border-b border-hair bg-jnu-800 text-white">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded border border-white/30 px-2 py-1 text-[12px] lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              ☰ Menu
            </button>
            <Link href="/admin" className="font-display text-[15px] uppercase tracking-wide text-white no-underline">
              JNU Administration
            </Link>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <Link href="/" target="_blank" className="hidden text-jnu-100 underline-offset-2 hover:underline sm:inline">
              View website ↗
            </Link>
            <Link href="/admin/account" className="text-jnu-100 no-underline hover:underline">
              {user.fullName}
              <span className="ml-1.5 rounded-sm border border-white/30 px-1 py-0.5 text-[10px] uppercase">
                {roleLabel(user.role)}
              </span>
            </Link>
            <button type="button" onClick={signOut} className="rounded border border-white/30 px-2 py-1 hover:bg-white/10">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-6 p-4">
        <nav
          aria-label="Admin sections"
          className={`${open ? 'block' : 'hidden'} w-full shrink-0 lg:block lg:w-60`}
        >
          {groups.map((g) => (
            <div key={g.title} className="mb-5">
              <h2 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                {g.title}
              </h2>
              <ul className="m-0 list-none p-0">
                {g.items.map((i) => {
                  const active = pathname === i.href || pathname.startsWith(`${i.href}/`)
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        onClick={() => setOpen(false)}
                        className={`block rounded px-2 py-1.5 text-[13px] no-underline ${
                          active ? 'bg-jnu-600 font-semibold text-white' : 'text-jnu-800 hover:bg-white'
                        }`}
                      >
                        {i.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <main className={`${open ? 'hidden' : 'block'} min-w-0 flex-1 lg:block`}>{children}</main>
      </div>
    </div>
  )
}
