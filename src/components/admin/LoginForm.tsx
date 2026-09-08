'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getMode } from '@/lib/store'
import { demoStaff } from '@/content/seed'

/**
 * Staff login, served from the public site as requested.
 *
 * In local (zero-config) mode this checks the demo accounts in
 * content/seed.ts. Those credentials are in the bundle and readable — that is
 * fine for an academic project and stated plainly below, so nobody mistakes it
 * for real access control. Configuring Supabase replaces this path with real
 * server-side password hashing; see the README.
 */
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mode = getMode()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const res = await signIn(email, password)
    setBusy(false)

    if (!res.ok) {
      setError(res.error)
      return
    }
    router.push('/admin/')
  }

  function fill(i: number) {
    setEmail(demoStaff[i].email)
    setPassword(demoStaff[i].password)
    setError(null)
  }

  return (
    <form onSubmit={onSubmit} className="panel">
      <h1 className="panel-head m-0 font-display">Staff Login</h1>
      <div className="panel-body">
        <p className="m-0 mb-4 text-[13px] text-muted">
          Access is restricted to authorised university staff. Accounts are issued by the
          registrar; there is no public sign-up.
        </p>

        <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
        />

        <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
        />

        {error ? (
          <p role="alert" className="m-0 mb-4 text-[13px] font-semibold text-[#a8322b]">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        {mode === 'local' ? (
          <div className="mt-5 rounded border border-hair border-l-[3px] border-l-sand-500 bg-shell p-3">
            <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-wide text-sand-600">
              Demo accounts — academic project
            </p>
            <ul className="m-0 list-none space-y-1.5 p-0 text-[12.5px]">
              {demoStaff.map((s, i) => (
                <li key={s.email} className="flex flex-wrap items-baseline gap-2">
                  <button
                    type="button"
                    onClick={() => fill(i)}
                    className="tnum text-jnu-600 underline"
                  >
                    {s.email}
                  </button>
                  <span className="tnum text-muted">{s.password}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted">
                    {s.role.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-2.5 text-[11.5px] leading-relaxed text-muted">
              These are checked in the browser, so they are not real access control —
              acceptable for a project demo only. Configure Supabase for server-side
              authentication before any live use.
            </p>
          </div>
        ) : null}
      </div>
    </form>
  )
}
