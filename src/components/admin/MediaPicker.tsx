'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { api, getJson } from '@/lib/admin-client'
import { formatBytes, pickVariant, type MediaItem } from '@/lib/media-shared'
import { Button, Empty, Field, Input, Loading, Modal, StatusLine, useStatus } from './ui'

/**
 * The media library: pick an existing file or upload a new one.
 *
 * Used by branding, the carousel, the gallery, notice attachments and the
 * Controller's signature, so uploading works the same way everywhere and
 * files get reused instead of duplicated.
 */

export function MediaPicker({
  kind = 'IMAGE',
  title = 'Choose an image',
  onPick,
  onClose,
}: {
  kind?: 'IMAGE' | 'DOCUMENT'
  title?: string
  onPick: (item: MediaItem) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const { status, show } = useStatus()
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const res = await getJson<{ media: MediaItem[] }>(`/api/admin/media?kind=${kind}`)
    setItems(res.ok ? res.data.media : [])
    if (!res.ok) show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  useEffect(() => {
    void load()
  }, [load])

  async function upload(file: File) {
    setBusy(true)
    const form = new FormData()
    form.append('file', file)
    const res = await api<{ media: MediaItem }>('/api/admin/media', { method: 'POST', body: form })
    setBusy(false)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    await load()
    onPick(res.data.media)
  }

  return (
    <Modal title={title} onClose={onClose} wide>
      <StatusLine status={status} />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-dashed border-hair p-3">
        <input
          ref={fileRef}
          type="file"
          accept={kind === 'IMAGE' ? 'image/jpeg,image/png,image/webp,image/gif' : 'application/pdf'}
          className="text-[13px]"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void upload(f)
          }}
        />
        <span className="text-[12px] text-muted">
          {busy
            ? 'Uploading and preparing sizes…'
            : kind === 'IMAGE'
              ? 'JPG, PNG, WebP or GIF up to 15 MB. Smaller sizes are generated automatically.'
              : 'PDF up to 50 MB. Compress large scans at ilovepdf.com before uploading.'}
        </span>
      </div>

      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>Nothing in the library yet. Upload the first file above.</Empty>
      ) : kind === 'IMAGE' ? (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="m-0">
              <button
                type="button"
                onClick={() => onPick(m)}
                className="block w-full overflow-hidden rounded border border-hair bg-shell text-left hover:border-jnu-400"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pickVariant(m.variants, 320)?.path ?? m.url}
                  alt=""
                  className="block aspect-[4/3] w-full object-cover"
                />
                <span className="block truncate px-2 py-1 text-[11px]">{m.filename}</span>
                <span className="block px-2 pb-1 text-[10px] text-muted">
                  {m.width}×{m.height} · {formatBytes(m.bytes)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="m-0 list-none p-0">
          {items.map((m) => (
            <li key={m.id} className="border-b border-hair last:border-b-0">
              <button
                type="button"
                onClick={() => onPick(m)}
                className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-[13px] hover:bg-shell"
              >
                <span className="truncate">{m.filename}</span>
                <span className="shrink-0 text-[11px] text-muted">{formatBytes(m.bytes)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

/**
 * A labelled image slot with Choose / Replace / Remove — the control used
 * wherever a setting points at one image.
 */
export function ImageField({
  label,
  hint,
  url,
  onPick,
  onClear,
  height = 64,
}: {
  label: string
  hint?: string
  url: string | null
  onPick: (item: MediaItem) => void
  onClear: () => void
  height?: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="grid shrink-0 place-items-center rounded border border-hair bg-shell px-2"
          style={{ height, minWidth: height }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" style={{ maxHeight: height - 8 }} className="max-w-[220px] object-contain" />
          ) : (
            <span className="px-3 text-[11px] text-muted">None</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {url ? 'Replace' : 'Choose'}
          </Button>
          {url ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {open ? (
        <MediaPicker
          title={label}
          onClose={() => setOpen(false)}
          onPick={(m) => {
            onPick(m)
            setOpen(false)
          }}
        />
      ) : null}
    </Field>
  )
}

/** Same, for a PDF attachment. */
export function DocumentField({
  label,
  hint,
  name,
  onPick,
  onClear,
}: {
  label: string
  hint?: string
  name: string | null
  onPick: (item: MediaItem) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-2">
        <Input readOnly value={name ?? 'No file attached'} className="max-w-[260px]" />
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          {name ? 'Replace' : 'Attach'}
        </Button>
        {name ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Remove
          </Button>
        ) : null}
      </div>
      {open ? (
        <MediaPicker
          kind="DOCUMENT"
          title={label}
          onClose={() => setOpen(false)}
          onPick={(m) => {
            onPick(m)
            setOpen(false)
          }}
        />
      ) : null}
    </Field>
  )
}
