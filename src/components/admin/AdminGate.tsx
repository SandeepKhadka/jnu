'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

type Gate =
  | { kind: 'checking' }
  | { kind: 'anon' }
  | { kind: 'unconfigured' }
  | { kind: 'ok'; user: User; staffName: string; role: string }
  | { kind: 'not-staff' }

/**
 * Client-side session gate for /admin.
 *
 * Being honest about what this is: on a static site the gate cannot be
 * enforced at the edge, so this only decides what the UI renders. It is a
 * convenience, not the security boundary. The boundary is RLS — an
 * unauthenticated or non-staff caller who bypasses this component entirely
 * still cannot read or write a single protected row.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [gate, setGate] = useState<Gate>({ kind: 'checking' })

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setGate({ kind: 'unconfigured' })
      return
    }

    let cancelled = false

    async function check() {
      const supabase = getSupabase()!
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) {
        if (!cancelled) setGate({ kind: 'anon' })
        return
      }

      // Membership of `staff` is what grants write access via RLS.
      const { data: staff } = await supabase
        .from('staff')
        .select('full_name, role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (!staff) {
        setGate({ kind: 'not-staff' })
        return
      }

      setGate({ kind: 'ok', user, staffName: staff.full_name, role: staff.role })
    }

    check()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) check()
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await getSupabase()?.auth.signOut()
    router.push('/')
  }

  if (gate.kind === 'checking') {
    return <p className="boxed py-12 text-[14px] text-muted">Checking session…</p>
  }

  if (gate.kind === 'unconfigured') {
    return (
      <div className="boxed py-12">
        <div className="panel mx-auto max-w-lg p-5">
          <h1 className="m-0 mb-2 font-display text-[19px] text-jnu-800">Admin not configured</h1>
          <p className="m-0 text-[13.5px] text-muted">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>, run{' '}
            <code>supabase/schema.sql</code>, then invite a staff user. See the README.
          </p>
        </div>
      </div>
    )
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

  if (gate.kind === 'not-staff') {
    return (
      <div className="boxed py-12">
        <div className="panel mx-auto max-w-lg p-5">
          <h1 className="m-0 mb-2 font-display text-[19px] text-jnu-800">Not authorised</h1>
          <p className="m-0 mb-4 text-[13.5px] text-muted">
            This account is signed in but is not registered as staff. Ask the registrar to
            add your account before trying again.
          </p>
          <button type="button" onClick={signOut} className="btn btn-secondary">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="boxed py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-hair pb-4">
        <div>
          <h1 className="m-0 font-display text-[22px] text-jnu-800">Administration</h1>
          <p className="m-0 text-xs text-muted">
            {gate.staffName} · <span className="uppercase tracking-wide">{gate.role.replace('_', ' ')}</span>
          </p>
        </div>
        <button type="button" onClick={signOut} className="btn btn-secondary">
          Sign out
        </button>
      </div>
      {children}
    </div>
  )
}
