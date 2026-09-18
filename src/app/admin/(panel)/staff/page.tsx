'use client'

import { useCallback, useEffect, useState } from 'react'

import { api, del, getJson, postJson, putJson } from '@/lib/admin-client'
import { ROLES, roleLabel } from '@/lib/permissions'
import {
  Button,
  Card,
  ConfirmButton,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Pill,
  Row,
  Select,
  StatusLine,
  Table,
  Td,
  useStatus,
} from '@/components/admin/ui'
import { formatNoticeDate } from '@/lib/content-types'

type Staff = {
  id: string
  email: string
  fullName: string
  role: string
  disabled: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
}

/** Staff accounts and what each role may do. */
export default function StaffPage() {
  const [rows, setRows] = useState<Staff[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null)
  const { status, show } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ staff: Staff[] }>('/api/admin/staff')
    if (res.ok) setRows(res.data.staff)
    else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (rows === null) return <Loading />

  return (
    <div>
      <PageHeader
        title="Staff accounts"
        description="Who can sign in, and what each of them can do."
        actions={<Button onClick={() => setAdding(true)}>Add person</Button>}
      />
      <StatusLine status={status} />

      {issued ? (
        <div className="mb-5 rounded border border-sand-500 bg-white p-4">
          <p className="m-0 text-[13px] font-semibold text-jnu-800">One-time password for {issued.email}</p>
          <p className="m-0 mt-1 text-[13px] text-muted">
            Give this to them in person or by a channel you trust. They must change it when they first sign in,
            and it is shown here only once.
          </p>
          <code className="mt-2 block rounded bg-shell px-3 py-2 text-[15px] tracking-wide">{issued.password}</code>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => setIssued(null)}>
            Done
          </Button>
        </div>
      ) : null}

      <Card>
        <Table head={['Name', 'Email', 'Role', 'Last signed in', 'Status', '']}>
          {rows.map((s) => (
            <tr key={s.id}>
              <Td className="font-semibold">{s.fullName}</Td>
              <Td className="text-[12px]">{s.email}</Td>
              <Td>{roleLabel(s.role)}</Td>
              <Td className="tnum whitespace-nowrap text-[12px] text-muted">
                {s.lastLoginAt ? formatNoticeDate(s.lastLoginAt.slice(0, 10)) : 'Never'}
              </Td>
              <Td className="whitespace-nowrap">
                {s.disabled ? <Pill tone="bad">Disabled</Pill> : <Pill tone="ok">Active</Pill>}
                {s.mustChangePassword ? (
                  <span className="ml-1">
                    <Pill tone="warn">Temp password</Pill>
                  </span>
                ) : null}
              </Td>
              <Td className="whitespace-nowrap text-right">
                <button type="button" className="mr-3 text-[12px] text-jnu-700 underline" onClick={() => setEditing(s)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="mr-3 text-[12px] text-jnu-700 underline"
                  onClick={async () => {
                    if (!window.confirm(`Reset the password for ${s.email}?`)) return
                    const res = await api<{ password: string }>(`/api/admin/staff/${s.id}`, { method: 'POST' })
                    if (!res.ok) {
                      show({ tone: 'error', text: res.error })
                      return
                    }
                    setIssued({ email: s.email, password: res.data.password })
                    await load()
                  }}
                >
                  Reset password
                </button>
                <ConfirmButton
                  question={`Delete the account for ${s.email}?`}
                  onConfirm={async () => {
                    const res = await del(`/api/admin/staff/${s.id}`)
                    if (!res.ok) {
                      show({ tone: 'error', text: res.error })
                      return
                    }
                    await load()
                  }}
                >
                  Delete
                </ConfirmButton>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="What each role can do">
        <ul className="m-0 list-none space-y-2 p-0 text-[13px]">
          {ROLES.map((r) => (
            <li key={r.id}>
              <span className="font-semibold text-jnu-800">{r.label}</span>
              <span className="block text-muted">{r.summary}</span>
            </li>
          ))}
        </ul>
      </Card>

      {adding ? (
        <AddStaff
          onClose={() => setAdding(false)}
          onCreated={async (email, password) => {
            setAdding(false)
            setIssued({ email, password })
            await load()
          }}
          onError={(t) => show({ tone: 'error', text: t })}
        />
      ) : null}

      {editing ? (
        <EditStaff
          staff={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
          }}
          onError={(t) => show({ tone: 'error', text: t })}
        />
      ) : null}
    </div>
  )
}

function AddStaff({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void
  onCreated: (email: string, password: string) => void
  onError: (t: string) => void
}) {
  const [form, setForm] = useState({ fullName: '', email: '', role: 'editor' })
  const [busy, setBusy] = useState(false)

  return (
    <Modal title="Add a staff account" onClose={onClose}>
      <div className="space-y-4">
        <Row cols={1}>
          <Field label="Name" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Email" required hint="Used to sign in.">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Role" required hint={ROLES.find((r) => r.id === form.role)?.summary}>
            <Select
              value={form.role}
              options={ROLES.map((r) => ({ value: r.id, label: r.label }))}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </Field>
        </Row>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const res = await postJson<{ password: string }>('/api/admin/staff', form)
            setBusy(false)
            if (!res.ok) {
              onError(res.error)
              return
            }
            onCreated(form.email, res.data.password)
          }}
        >
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </div>
    </Modal>
  )
}

function EditStaff({
  staff,
  onClose,
  onSaved,
  onError,
}: {
  staff: Staff
  onClose: () => void
  onSaved: () => void
  onError: (t: string) => void
}) {
  const [form, setForm] = useState({ fullName: staff.fullName, role: staff.role, disabled: staff.disabled })
  const [busy, setBusy] = useState(false)

  return (
    <Modal title={staff.email} onClose={onClose}>
      <div className="space-y-4">
        <Row cols={1}>
          <Field label="Name" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Role" required hint={ROLES.find((r) => r.id === form.role)?.summary}>
            <Select
              value={form.role}
              options={ROLES.map((r) => ({ value: r.id, label: r.label }))}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={form.disabled}
              onChange={(e) => setForm({ ...form, disabled: e.target.checked })}
            />
            Disabled — cannot sign in
          </label>
        </Row>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const res = await putJson(`/api/admin/staff/${staff.id}`, form)
            setBusy(false)
            if (!res.ok) {
              onError(res.error)
              return
            }
            onSaved()
          }}
        >
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
