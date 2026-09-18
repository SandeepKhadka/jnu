'use client'

import { useCallback, useEffect, useState } from 'react'

import { del, getJson, move, postJson, putJson } from '@/lib/admin-client'
import { MediaPicker } from '@/components/admin/MediaPicker'
import type { GalleryCategoryDTO, GalleryPhotoDTO } from '@/lib/content-dto'
import { pickVariant } from '@/lib/media-shared'
import {
  Button,
  Card,
  Check,
  ConfirmButton,
  Field,
  IconButton,
  Input,
  Loading,
  Modal,
  PageHeader,
  StatusLine,
  Textarea,
  useStatus,
} from '@/components/admin/ui'

/** The Photo Tour: sections of photographs, each with its own description. */
export default function GalleryPage() {
  const [categories, setCategories] = useState<GalleryCategoryDTO[] | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newSection, setNewSection] = useState(false)
  const [editing, setEditing] = useState<GalleryPhotoDTO | null>(null)
  const { status, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ categories: GalleryCategoryDTO[] }>('/api/admin/gallery')
    if (res.ok) setCategories(res.data.categories)
    else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function reorderPhotos(c: GalleryCategoryDTO, list: GalleryPhotoDTO[]) {
    setCategories((prev) => (prev ?? []).map((x) => (x.id === c.id ? { ...x, photos: list } : x)))
    await postJson('/api/admin/reorder', { entity: 'galleryPhoto', ids: list.map((p) => p.id) })
  }

  async function reorderSections(list: GalleryCategoryDTO[]) {
    setCategories(list)
    await postJson('/api/admin/reorder', { entity: 'galleryCategory', ids: list.map((c) => c.id) })
  }

  async function removeIt(kind: 'category' | 'photo', id: string) {
    const res = await del(`/api/admin/gallery/${kind}/${id}`)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    await load()
  }

  if (categories === null) return <Loading />

  return (
    <div>
      <PageHeader
        title="Photo gallery"
        description="The Photo Tour page. Every photograph needs a description — it is what image search reads, and what a screen reader announces."
        actions={<Button onClick={() => setNewSection(true)}>New section</Button>}
      />
      <StatusLine status={status} />

      {categories.map((c, ci) => (
        <Card
          key={c.id}
          title={c.title}
          description={c.blurb}
          actions={
            <>
              <IconButton label="Move up" onClick={() => reorderSections(move(categories, ci, ci - 1))}>
                ↑
              </IconButton>
              <IconButton label="Move down" onClick={() => reorderSections(move(categories, ci, ci + 1))}>
                ↓
              </IconButton>
              <Button size="sm" onClick={() => setAddingTo(c.id)}>
                Add photos
              </Button>
              <ConfirmButton question={`Delete the section "${c.title}"?`} onConfirm={() => removeIt('category', c.id)}>
                Delete
              </ConfirmButton>
            </>
          }
        >
          {c.photos.length === 0 ? (
            <p className="m-0 text-[13px] text-muted">No photographs in this section yet.</p>
          ) : (
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
              {c.photos.map((p, pi) => (
                <li key={p.id} className="rounded border border-hair">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pickVariant(p.variants, 320)?.path ?? ''}
                    alt=""
                    className="block aspect-[5/4] w-full rounded-t object-cover"
                  />
                  <div className="p-2">
                    <p className="m-0 line-clamp-2 text-[12px]">{p.caption}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <IconButton label="Move left" onClick={() => reorderPhotos(c, move(c.photos, pi, pi - 1))}>
                        ←
                      </IconButton>
                      <IconButton label="Move right" onClick={() => reorderPhotos(c, move(c.photos, pi, pi + 1))}>
                        →
                      </IconButton>
                      <button type="button" className="ml-1 text-[11px] text-jnu-700 underline" onClick={() => setEditing(p)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-[11px] text-[#a8322b] underline"
                        onClick={() => {
                          if (window.confirm('Remove this photograph from the gallery?')) void removeIt('photo', p.id)
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}

      {addingTo ? (
        <MediaPicker
          title="Add a photograph"
          onClose={() => setAddingTo(null)}
          onPick={async (m) => {
            const res = await postJson('/api/admin/gallery', {
              type: 'photo',
              categoryId: addingTo,
              mediaId: m.id,
              alt: m.alt || m.filename,
              caption: m.alt || '',
            })
            if (!res.ok) show({ tone: 'error', text: res.error })
            await load()
            // Left open so several photographs can be added in one go.
          }}
        />
      ) : null}

      {newSection ? (
        <SectionModal
          onClose={() => setNewSection(false)}
          onSaved={async () => {
            setNewSection(false)
            saved()
            await load()
          }}
          onError={(t) => show({ tone: 'error', text: t })}
        />
      ) : null}

      {editing ? (
        <PhotoModal
          photo={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            saved()
            await load()
          }}
          onError={(t) => show({ tone: 'error', text: t })}
        />
      ) : null}
    </div>
  )
}

function SectionModal({ onClose, onSaved, onError }: { onClose: () => void; onSaved: () => void; onError: (t: string) => void }) {
  const [title, setTitle] = useState('')
  const [blurb, setBlurb] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal title="New gallery section" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title" required hint="e.g. Campus, Laboratories, Convocation">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description" hint="One line under the section heading.">
          <Textarea rows={2} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </Field>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const res = await postJson('/api/admin/gallery', { type: 'category', title, blurb })
            setBusy(false)
            if (!res.ok) {
              onError(res.error)
              return
            }
            onSaved()
          }}
        >
          {busy ? 'Saving…' : 'Create section'}
        </Button>
      </div>
    </Modal>
  )
}

function PhotoModal({
  photo,
  categories,
  onClose,
  onSaved,
  onError,
}: {
  photo: GalleryPhotoDTO
  categories: GalleryCategoryDTO[]
  onClose: () => void
  onSaved: () => void
  onError: (t: string) => void
}) {
  const [form, setForm] = useState({
    alt: photo.alt,
    caption: photo.caption,
    categoryId: photo.categoryId,
    published: photo.published,
  })
  const [busy, setBusy] = useState(false)

  return (
    <Modal title="Edit photograph" onClose={onClose}>
      <div className="space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pickVariant(photo.variants, 640)?.path ?? ''} alt="" className="w-full rounded border border-hair" />
        <Field label="Description (alt text)" required hint="What the photograph shows. Do not name people unless the university has confirmed who they are.">
          <Textarea rows={2} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
        </Field>
        <Field label="Caption" hint="Printed under the photograph.">
          <Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
        </Field>
        <Field label="Section">
          <select
            className="w-full rounded border border-hair bg-white px-2.5 py-1.5 text-[13px]"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Check label="Published" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const res = await putJson(`/api/admin/gallery/photo/${photo.id}`, form)
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
