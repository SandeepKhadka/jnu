'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

/**
 * Staff login, served from the public site as requested.
 *
 * What makes this a real login rather than a decorative one: no credential of
 * any kind lives in this bundle. The form posts to Supabase Auth, which does
 * the password hashing (bcrypt) and returns a signed JWT. This file contains
 * no password to find in DevTools.
 *
 * The corollary, worth being explicit about: hiding this page proves nothing.
 * Security comes from the RLS policies in supabase/schema.sql, which reject
 * writes from anyone who is not in the `staff` table — not from the login
 * screen being hard to locate.
 */
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const supabase = getSupabase()
    if (!supabase) {
      setError('Authentication is not configured. See the README.')
      return
    }

    setBusy(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)

    if (authError) {
      // Deliberately generic: never reveal whether the account exists.
      setError('Incorrect email or password.')
      return
    }

    router.push('/admin/')
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
      </div>
    </form>
  )
}
