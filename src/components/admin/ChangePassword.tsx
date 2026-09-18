'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { postJson } from '@/lib/admin-client'
import { MIN_STAFF_PASSWORD } from '@/lib/permissions'
import { Button, Card, Field, Input, StatusLine, useStatus } from './ui'

/**
 * Change your own password.
 *
 * Also the whole screen when an account is still on the temporary password an
 * administrator issued: until it is replaced the account can do nothing else,
 * so a password read out over a desk or sent in a message stops being a
 * working credential the moment it is used.
 */
export function ChangePassword({ forced = false }: { forced?: boolean }) {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const { status, show } = useStatus()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== repeat) {
      show({ tone: 'error', text: 'The new passwords do not match.' })
      return
    }
    setBusy(true)
    const res = await postJson('/api/auth/password', { current, next })
    setBusy(false)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    setCurrent('')
    setNext('')
    setRepeat('')
    show({ tone: 'ok', text: 'Password changed.' })
    router.refresh()
  }

  return (
    <Card
      title={forced ? 'Set your password' : 'Change password'}
      description={
        forced
          ? 'This account is using a temporary password. Choose your own to continue.'
          : undefined
      }
    >
      <form onSubmit={submit} className="max-w-md space-y-4">
        <StatusLine status={status} />
        <Field label={forced ? 'Temporary password' : 'Current password'} required>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="New password" required hint={`At least ${MIN_STAFF_PASSWORD} characters. A short phrase you can remember beats a short jumble.`}>
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_STAFF_PASSWORD}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field label="Repeat new password" required>
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </Card>
  )
}
