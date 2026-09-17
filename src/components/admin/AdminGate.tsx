'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, signOut, type Session } from '@/lib/store'

type Gate =
  | { kind: 'checking' }
  | { kind: 'anon' }
  | { kind: 'ok'; session: Session }

/**
 * Session gate for /admin.
 *
 * This asks the server who is signed in — the session is an httpOnly cookie,
 * so it cannot be answered in the browser. It decides what the UI renders,
 * and it is no longer the only thing standing in the way: every protected API
 * route calls requireStaff() and verifies the same cookie server-side, so
 * bypassing this component gets you a page with no data in it.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [gate, setGate] = useState<Gate>({ kind: 'checking' })

  useEffect(() => {
    let cancelled = false

    getSession().then((session) => {
      if (cancelled) return
      setGate(session ? { kind: 'ok', session } : { kind: 'anon' })
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function onSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (gate.kind === 'checking') {
    return <p className="boxed py-12 text-[14px] text-muted">Checking session…</p>
  }

  if (gate.kind === 'anon') {
    return (
      <div className="boxed py-12">
        <div className="panel mx-auto max-w-lg p-5">
          <h1 className="m-0 mb-2 font-display text-[19px] text-jnu-800">Sign in required</h1>
          <p className="m-0 mb-4 text-[13.5px] text-muted">
            This area is restricted to authorised university staff.
          </p>
          <Link href="/admin/login/" className="btn btn-primary">
            Go to staff login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="boxed py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-hair pb-4">
        <div>
          <h1 className="m-0 font-display text-[22px] text-jnu-800">Administration</h1>
          <p className="m-0 text-xs text-muted">
            {gate.session.full_name} ·{' '}
            <span className="uppercase tracking-wide">
              {gate.session.role.replace('_', ' ')}
            </span>
          </p>
        </div>
        <button type="button" onClick={onSignOut} className="btn btn-secondary">
          Sign out
        </button>
      </div>

      <div className="mb-5 rounded border border-hair border-l-[3px] border-l-[#2c6549] bg-white px-4 py-3">
        <p className="m-0 text-[13px] text-muted">
          <strong className="text-[#2c6549]">Database mode. </strong>
          Results, certificates and this audit trail are stored server-side and read
          through the API. Passwords are bcrypt-hashed and your session is an httpOnly
          cookie, so changes here are visible on every device.
        </p>
      </div>

      {children}
    </div>
  )
}
