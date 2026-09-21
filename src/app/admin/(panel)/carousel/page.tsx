'use client'

import { useCallback, useEffect, useState } from 'react'

import { del, getJson, move, postJson, putJson } from '@/lib/admin-client'
import { MediaPicker } from '@/components/admin/MediaPicker'
import type { SlideDTO } from '@/lib/content-dto'
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
  PageHeader,
  Pill,
  StatusLine,
  Textarea,
  useStatus,
} from '@/components/admin/ui'

/** The home page slideshow. */
export default function CarouselPage() {
  const [slides, setSlides] = useState<SlideDTO[] | null>(null)
  const [picking, setPicking] = useState(false)
  const { status, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ slides: SlideDTO[] }>('/api/admin/slides')
    if (res.ok) setSlides(res.data.slides)
    else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function reorder(list: SlideDTO[]) {
    setSlides(list)
    await postJson('/api/admin/reorder', { entity: 'slide', ids: list.map((s) => s.id) })
  }

  async function update(s: SlideDTO) {
    const res = await putJson(`/api/admin/slides/${s.id}`, s)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    saved()
    await load()
  }

  async function remove(s: SlideDTO) {
    const res = await del(`/api/admin/slides/${s.id}`)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    await load()
  }

  if (slides === null) return <Loading />

  return (
    <div>
      <PageHeader
        title="Carousel"
        description="The slideshow at the top of the home page. It changes every six seconds and pauses when someone hovers over it."
        actions={<Button onClick={() => setPicking(true)}>Add slide</Button>}
      />
      <StatusLine status={status} />

      <div className="mb-4 rounded border border-hair bg-white p-3 text-[12.5px] text-muted">
        Only the first slide loads when the page opens, so extra slides cost visitors nothing until they are
        shown. Uploaded images are resized automatically — upload the largest version you have, ideally around
        1600 pixels wide.
      </div>

      {slides.map((s, i) => (
        <SlideCard
          key={s.id}
          slide={s}
          onUp={() => reorder(move(slides, i, i - 1))}
          onDown={() => reorder(move(slides, i, i + 1))}
          onSave={update}
          onDelete={() => remove(s)}
        />
      ))}

      {slides.length === 0 ? (
        <Card>
          <p className="m-0 text-[13px] text-muted">No slides yet. The home page shows a plain background until one is added.</p>
        </Card>
      ) : null}

      {picking ? (
        <MediaPicker
          title="Choose a slide image"
          onClose={() => setPicking(false)}
          onPick={async (m) => {
            setPicking(false)
            const res = await postJson('/api/admin/slides', { mediaId: m.id, alt: m.alt || m.filename })
            if (!res.ok) {
              show({ tone: 'error', text: res.error })
              return
            }
            await load()
          }}
        />
      ) : null}
    </div>
  )
}

function SlideCard({
  slide,
  onUp,
  onDown,
  onSave,
  onDelete,
}: {
  slide: SlideDTO
  onUp: () => void
  onDown: () => void
  onSave: (s: SlideDTO) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(slide)
  const [replacing, setReplacing] = useState(false)
  useEffect(() => setDraft(slide), [slide])

  return (
    <Card
      actions={
        <>
          <IconButton label="Move up" onClick={onUp}>
            ↑
          </IconButton>
          <IconButton label="Move down" onClick={onDown}>
            ↓
          </IconButton>
          <Button size="sm" onClick={() => onSave(draft)}>
            Save
          </Button>
          <ConfirmButton question="Remove this slide from the carousel?" onConfirm={onDelete}>
            Remove
          </ConfirmButton>
        </>
      }
    >
      <div className="flex flex-wrap gap-4">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pickVariant(slide.variants, 640)?.path ?? ''}
            alt=""
            className="h-28 w-56 rounded border border-hair object-cover"
            style={slide.banner ? { objectFit: 'contain', background: slide.bannerBackground ?? '#fff' } : undefined}
          />
          <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => setReplacing(true)}>
            Replace image
          </Button>
        </div>
        <div className="min-w-[280px] flex-1 space-y-3">
          <Field
            label="Description (alt text)"
            required
            hint="What the picture shows. Read aloud by screen readers and used by image search."
          >
            <Textarea rows={2} value={draft.alt} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center gap-6">
            <Check
              label="Show on the website"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            />
            <Check
              label="Artwork with text in it"
              hint="Shows the whole image instead of filling the space, and hides the headline over it."
              checked={draft.banner}
              onChange={(e) => setDraft({ ...draft, banner: e.target.checked })}
            />
            {draft.banner ? (
              <label className="flex items-center gap-2 text-[12px]">
                Background
                <Input
                  type="color"
                  className="h-8 w-14 p-0.5"
                  value={draft.bannerBackground ?? '#ffffff'}
                  onChange={(e) => setDraft({ ...draft, bannerBackground: e.target.value })}
                />
              </label>
            ) : null}
            {!slide.enabled ? <Pill tone="muted">Hidden</Pill> : null}
          </div>
        </div>
      </div>

      {replacing ? (
        <MediaPicker
          title="Replace the slide image"
          onClose={() => setReplacing(false)}
          onPick={(m) => {
            setReplacing(false)
            // Saved immediately rather than folded into the draft: swapping the
            // picture is the edit, and leaving it pending behind a Save button
            // reads as though it did not take.
            onSave({ ...draft, mediaId: m.id })
          }}
        />
      ) : null}
    </Card>
  )
}
