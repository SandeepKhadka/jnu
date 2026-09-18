'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { api, del, getJson, patchJson } from '@/lib/admin-client'
import { formatBytes, pickVariant, type MediaItem } from '@/lib/media-shared'
import {
  Button,
  Card,
  ConfirmButton,
  Empty,
  Input,
  Loading,
  PageHeader,
  Pill,
  StatusLine,
  useStatus,
} from '@/components/admin/ui'

/** Everything uploaded for the website: images and PDFs. */
export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { status, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ media: MediaItem[] }>('/api/admin/media')
    if (res.ok) setItems(res.data.media)
    else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function upload(files: FileList) {
    setBusy(true)
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      const res = await api('/api/admin/media', { method: 'POST', body: form })
      if (!res.ok) {
        show({ tone: 'error', text: `${file.name}: ${res.error}` })
        break
      }
    }
    setBusy(false)
    await load()
  }

  async function remove(m: MediaItem) {
    const res = await del(`/api/admin/media/${m.id}`)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    show({ tone: 'ok', text: `Deleted ${m.filename}.` })
    await load()
  }

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Images are converted to modern formats at several sizes when uploaded, so pages stay fast. Location data in photographs is removed."
        actions={
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : 'Upload files'}
          </Button>
        }
      />
      <StatusLine status={status} />
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        onChange={(e) => {
          const f = e.target.files
          e.target.value = ''
          if (f?.length) void upload(f)
        }}
      />

      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <Card>
          <Empty>Nothing uploaded yet.</Empty>
        </Card>
      ) : (
        <Card>
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <li key={m.id} className="flex gap-3 rounded border border-hair p-2">
                {m.kind === 'IMAGE' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pickVariant(m.variants, 320)?.path ?? m.url}
                    alt=""
                    className="h-20 w-24 shrink-0 rounded border border-hair object-cover"
                  />
                ) : (
                  <span className="grid h-20 w-24 shrink-0 place-items-center rounded border border-hair bg-shell text-[11px] text-muted">
                    PDF
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[12.5px] font-semibold">{m.filename}</p>
                  <p className="m-0 text-[11px] text-muted">
                    {m.kind === 'IMAGE' ? `${m.width}×${m.height} · ` : ''}
                    {formatBytes(m.bytes)}
                    {m.createdAt ? ` · ${m.createdAt.slice(0, 10)}` : ''}
                  </p>
                  {m.kind === 'IMAGE' ? (
                    <Input
                      className="mt-1.5"
                      placeholder="Default description"
                      defaultValue={m.alt}
                      onBlur={async (e) => {
                        if (e.target.value === m.alt) return
                        const res = await patchJson(`/api/admin/media/${m.id}`, { alt: e.target.value })
                        if (res.ok) saved()
                        else show({ tone: 'error', text: res.error })
                      }}
                    />
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-2">
                    <a href={m.url} target="_blank" rel="noreferrer" className="text-[11px] text-jnu-700 underline">
                      Open
                    </a>
                    <ConfirmButton question={`Delete ${m.filename}?`} onConfirm={() => remove(m)}>
                      Delete
                    </ConfirmButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-4 text-[12px] text-muted">
            A file still used by a slide, the gallery, a notice or the branding cannot be deleted — the message
            will say what is using it. <Pill tone="muted">SVG files are not accepted</Pill>
          </p>
        </Card>
      )}
    </div>
  )
}
