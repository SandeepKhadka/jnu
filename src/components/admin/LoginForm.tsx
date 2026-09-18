'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { postJson } from '@/lib/admin-client'
import { Button, Field, Input, StatusLine, useStatus } from './ui'

/**
 * Staff sign-in.
 *
 * The password is compared against a bcrypt hash on the server; the browser
 * receives only an httpOnly session cookie. The route is throttled per IP and
 * per account, and answers the same way whether or not the account exists.
 *
 * There are no demo or default credentials — not here and not in the
 * database. The first administrator is created with `npm run admin:create`.
 */
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { status, show } = useStatus()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await postJson('/api/auth/login', { email, password })
    setBusy(false)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded border border-hair bg-white p-6">
      <h1 className="m-0 mb-1 font-display text-[19px] text-jnu-800">Staff sign in</h1>
      <p className="m-0 mb-5 text-[13px] text-muted">University administration</p>

      <StatusLine status={status} />

      <div className="space-y-4">
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>

      <p className="m-0 mt-5 border-t border-hair pt-4 text-[12px] text-muted">
        Forgotten your password? An administrator can reset it under Staff accounts.
      </p>
    </form>
  )
}
