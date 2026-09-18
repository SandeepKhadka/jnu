'use client'

import { useCallback, useEffect, useState } from 'react'

import { del, getJson, postJson, putJson } from '@/lib/admin-client'
import { DocumentField } from '@/components/admin/MediaPicker'
import type { NoticeDTO } from '@/lib/content-dto'
import { NOTICE_CATEGORIES, formatNoticeDate } from '@/lib/content-types'
import {
  Button,
  Card,
  Check,
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

/**
 * Notices and circulars.
 *
 * These used to require editing a source file and redeploying. They are now
 * live the moment they are saved, and still part of the page's HTML, so
 * search engines index them exactly as before.
 */
export default function NoticesPage() {
  const [notices, setNotices] = useState<NoticeDTO[] | null>(null)
  const [editing, setEditing] = useState<Partial<NoticeDTO> | null>(null)
  const { status, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ notices: NoticeDTO[] }>('/api/admin/notices')
    if (res.ok) setNotices(res.data.notices)
    else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function remove(n: NoticeDTO) {
    const res = await del(`/api/admin/notices/${n.id}`)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    show({ tone: 'ok', text: 'Notice deleted.' })
    await load()
  }

  if (notices === null) return <Loading />

  return (
    <div>
      <PageHeader
        title="Notices & circulars"
        description="Shown on the notices page, the home page board and the scrolling strip. Pinned notices stay at the top."
        actions={
          <Button onClick={() => setEditing({ date: new Date().toISOString().slice(0, 10), category: 'General' })}>
            New notice
          </Button>
        }
      />
      <StatusLine status={status} />

      <Card>
        <Table head={['Date', 'Title', 'Category', 'Links to', 'Status', '']}>
          {notices.map((n) => (
            <tr key={n.id}>
              <Td className="tnum whitespace-nowrap">{formatNoticeDate(n.date)}</Td>
              <Td className="font-semibold">
                {n.title}
                {n.pinned ? <span className="ml-2"><Pill tone="warn">Pinned</Pill></span> : null}
              </Td>
              <Td>{n.category}</Td>
              <Td className="max-w-[220px] truncate text-[12px] text-muted">
                {n.href ?? (n.fileUrl ? 'PDF attachment' : '—')}
              </Td>
              <Td>{n.published ? <Pill tone="ok">Published</Pill> : <Pill tone="muted">Draft</Pill>}</Td>
              <Td className="whitespace-nowrap text-right">
                <button type="button" className="mr-3 text-[12px] text-jnu-700 underline" onClick={() => setEditing(n)}>
                  Edit
                </button>
                <ConfirmButton question={`Delete "${n.title}"?`} onConfirm={() => remove(n)}>
                  Delete
                </ConfirmButton>
              </Td>
            </tr>
          ))}
        </Table>
        {notices.length === 0 ? <p className="m-0 mt-3 text-[13px] text-muted">No notices yet.</p> : null}
      </Card>

      {editing ? (
        <NoticeModal
          notice={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            saved()
            await load()
          }}
          onError={(text) => show({ tone: 'error', text })}
        />
      ) : null}
    </div>
  )
}

function NoticeModal({
  notice,
  onClose,
  onSaved,
  onError,
}: {
  notice: Partial<NoticeDTO>
  onClose: () => void
  onSaved: () => void
  onError: (t: string) => void
}) {
  const [form, setForm] = useState({
    title: notice.title ?? '',
    date: notice.date ?? new Date().toISOString().slice(0, 10),
    category: notice.category ?? 'General',
    href: notice.href ?? '',
    fileId: notice.fileId ?? null,
    fileName: notice.fileUrl ? 'Attached PDF' : null,
    pinned: notice.pinned ?? false,
    published: notice.published ?? true,
  })
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    const payload = { ...form, href: form.href || null }
    const res = notice.id
      ? await putJson(`/api/admin/notices/${notice.id}`, payload)
      : await postJson('/api/admin/notices', payload)
    setBusy(false)
    if (!res.ok) {
      onError(res.error)
      return
    }
    onSaved()
  }

  return (
    <Modal title={notice.id ? 'Edit notice' : 'New notice'} onClose={onClose} wide>
      <div className="space-y-4">
        <Row>
          <Field label="Title" required full>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Category" required>
            <Select
              value={form.category}
              options={NOTICE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          <Field label="Link" hint="A page on this site, e.g. /admission/fee-structure/. Leave empty if you attach a PDF instead.">
            <Input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} />
          </Field>
          <DocumentField
            label="PDF attachment"
            hint="Uploaded to the media library."
            name={form.fileName}
            onPick={(m) => setForm({ ...form, fileId: m.id, fileName: m.filename })}
            onClear={() => setForm({ ...form, fileId: null, fileName: null })}
          />
        </Row>
        <div className="flex flex-wrap gap-6">
          <Check
            label="Pin to the top"
            hint="Marked “Important” and listed first."
            checked={form.pinned}
            onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
          />
          <Check
            label="Published"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save notice'}
        </Button>
      </div>
    </Modal>
  )
}
