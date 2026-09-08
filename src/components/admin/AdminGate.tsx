'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, signOut, getMode, storageAvailable, type Session } from '@/lib/store'

type Gate =
  | { kind: 'checking' }
  | { kind: 'anon' }
  | { kind: 'ok'; session: Session }

/**
 * Session gate for /admin.
 *
 * Honest about what this is: on a static site the gate cannot be enforced at
 * the edge, so it decides what the UI renders and nothing more. In local mode
 * that is the whole of it. With Supabase configured, Row Level Security is the
 * real boundary and this stays a convenience.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [gate, setGate] = useState<Gate>({ kind: 'checking' })

  useEffect(() => {
    const session = getSession()
    setGate(session ? { kind: 'ok', session } : { kind: 'anon' })
  }, [])

  async function onSignOut() {
    await signOut()
    router.push('/')
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

      <ModeBanner />
      {children}
    </div>
  )
}

/** States the storage model plainly, so nobody is surprised by its limits. */
function ModeBanner() {
  const [noStorage, setNoStorage] = useState(false)
  const mode = getMode()

  useEffect(() => {
    setNoStorage(!storageAvailable())
  }, [])

  if (noStorage) {
    return (
      <div className="mb-5 rounded border border-hair border-l-[3px] border-l-[#a8322b] bg-white px-4 py-3">
        <p className="m-0 text-[13px] text-muted">
          <strong className="text-[#a8322b]">Storage unavailable. </strong>
          This browser is blocking site data (a private window, or blocked storage
          settings), so changes made here cannot be saved. Seed data still displays, but
          edits will be lost on reload.
        </p>
      </div>
    )
  }

  if (mode === 'supabase') {
    return (
      <div className="mb-5 rounded border border-hair border-l-[3px] border-l-[#2c6549] bg-white px-4 py-3">
        <p className="m-0 text-[13px] text-muted">
          <strong className="text-[#2c6549]">Supabase mode. </strong>
          Connected to a hosted database with server-side authentication.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-5 rounded border border-hair border-l-[3px] border-l-sand-500 bg-white px-4 py-3">
      <p className="m-0 text-[13px] text-muted">
        <strong className="text-jnu-800">Local demo mode. </strong>
        Data comes from the seed file and your changes are saved in this browser
        (localStorage), so the admin panel and the public pages stay in step on this
        machine. Changes do not sync to other devices — configure Supabase for that.
      </p>
    </div>
  )
}
