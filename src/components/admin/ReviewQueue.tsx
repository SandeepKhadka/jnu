'use client'

import { useCallback, useEffect, useState } from 'react'

import { formatNoticeDate } from '@/lib/content-types'
import { CORRECTABLE_FIELDS, type CorrectableField } from '@/lib/corrections'
import {
  getReviewQueue,
  resolveCorrection,
  reviewPhoto,
  type PendingCorrection,
  type PendingPhoto,
} from '@/lib/store'

/**
 * Work waiting on staff: student photographs to approve, and requests to
 * correct identity fields students cannot edit themselves.
 *
 * Photos: registrar or exam cell. Corrections: registrar only — they rewrite
 * the fields certificate verification checks against. The server enforces
 * both; a 403 from it is shown here as-is rather than hidden, so a member of
 * staff without the role learns why rather than seeing a button do nothing.
 */
export function ReviewQueue() {
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [corrections, setCorrections] = useState<PendingCorrection[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const q = await getReviewQueue()
    setPhotos(q.photos)
    setCorrections(q.corrections)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <p className="text-[14px] text-muted">Loading…</p>

  return (
    <div>
      <h2 className="rule-heading">
        Photographs awaiting approval{' '}
        <span className="tnum text-[14px] font-normal text-muted">({photos.length})</span>
      </h2>
      {photos.length === 0 ? (
        <p className="text-[14px] text-muted">Nothing waiting.</p>
      ) : (
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          {photos.map((p) => (
            <PhotoCard key={p.studentId} item={p} onDone={load} />
          ))}
        </div>
      )}

      <h2 className="rule-heading mt-10">
        Correction requests{' '}
        <span className="tnum text-[14px] font-normal text-muted">({corrections.length})</span>
      </h2>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Applying a correction changes the student&rsquo;s record, which certificate
        verification checks against. It does not change names already printed on issued
        certificates or marksheets — reissue those separately if required. Registrar only.
      </p>
      {corrections.length === 0 ? (
        <p className="text-[14px] text-muted">Nothing waiting.</p>
      ) : (
        <div className="grid gap-4">
          {corrections.map((c) => (
            <CorrectionCard key={c.id} item={c} onDone={load} />
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoCard({ item, onDone }: { item: PendingPhoto; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act(action: 'approve' | 'reject') {
    setBusy(true)
    setError(null)
    const res = await reviewPhoto(item.studentId, action)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    await onDone()
  }

  return (
    <article className="panel">
      <div className="panel-body">
        <p className="m-0 text-[14px] font-semibold text-jnu-800">{item.fullName}</p>
        <p className="tnum m-0 mb-3 text-[12px] text-muted">
          {item.rollNo} · {item.programme}
          {item.submittedAt ? ` · ${formatNoticeDate(item.submittedAt.slice(0, 10))}` : ''}
        </p>

        <div className="flex gap-4">
          <figure className="m-0">
            {item.currentPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.currentPhotoUrl}
                alt={`Current photograph of ${item.fullName}`}
                width={96}
                height={120}
                className="h-[120px] w-[96px] rounded border border-hair object-cover"
              />
            ) : (
              <div className="grid h-[120px] w-[96px] place-items-center rounded border border-dashed border-hair text-[10px] text-muted">
                None
              </div>
            )}
            <figcaption className="mt-1 text-center text-[10px] uppercase tracking-wide text-muted">
              Current
            </figcaption>
          </figure>
          <figure className="m-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.pendingPhotoUrl}
              alt={`Photograph submitted by ${item.fullName}`}
              width={96}
              height={120}
              className="h-[120px] w-[96px] rounded border-2 border-[#9a6a10] object-cover"
            />
            <figcaption className="mt-1 text-center text-[10px] uppercase tracking-wide text-[#9a6a10]">
              Submitted
            </figcaption>
          </figure>
        </div>

        {error ? (
          <p role="alert" className="m-0 mt-3 text-[12px] text-[#a8322b]">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => act('approve')}
            className="btn btn-primary !px-3 !py-1.5 !text-[12px]"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act('reject')}
            className="btn btn-secondary !px-3 !py-1.5 !text-[12px]"
          >
            Reject
          </button>
        </div>
      </div>
    </article>
  )
}

function CorrectionCard({
  item,
  onDone,
}: {
  item: PendingCorrection
  onDone: () => Promise<void>
}) {
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const label = CORRECTABLE_FIELDS[item.field as CorrectableField] ?? item.field

  async function act(action: 'apply' | 'reject') {
    if (action === 'reject' && !remarks.trim()) {
      setError('Give the student a reason for declining.')
      return
    }
    if (
      action === 'apply' &&
      !window.confirm(
        `Change ${label.toLowerCase()} for ${item.rollNo} from "${item.currentValue}" to "${item.requestedValue}"?\n\n` +
          'This changes what certificate verification checks against.'
      )
    ) {
      return
    }

    setBusy(true)
    setError(null)
    const res = await resolveCorrection(item.id, action, remarks)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    await onDone()
  }

  return (
    <article className="panel">
      <div className="panel-body">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="m-0 text-[14px] font-semibold text-jnu-800">
            {item.fullName} <span className="tnum font-normal text-muted">({item.rollNo})</span>
          </p>
          <p className="tnum m-0 text-[12px] text-muted">
            {formatNoticeDate(item.createdAt.slice(0, 10))}
          </p>
        </div>

        <dl className="m-0 mt-3 grid gap-x-6 gap-y-1.5 text-[13.5px] sm:grid-cols-[140px_1fr]">
          <dt className="text-muted">Field</dt>
          <dd className="m-0 font-semibold">{label}</dd>
          <dt className="text-muted">On record</dt>
          <dd className="m-0">{item.currentValue}</dd>
          <dt className="text-muted">Requested</dt>
          <dd className="m-0 font-semibold text-[#2c6549]">{item.requestedValue}</dd>
          {item.reason ? (
            <>
              <dt className="text-muted">Reason given</dt>
              <dd className="m-0">{item.reason}</dd>
            </>
          ) : null}
        </dl>

        <label htmlFor={`rm-${item.id}`} className="mb-1 mt-4 block text-[12px] font-semibold text-jnu-800">
          Remarks to student{' '}
          <span className="font-normal text-muted">(required to decline)</span>
        </label>
        <input
          id={`rm-${item.id}`}
          type="text"
          maxLength={500}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Verified against Class 10 certificate"
          className="w-full rounded border border-hair px-3 py-1.5 text-[13px]"
        />

        {error ? (
          <p role="alert" className="m-0 mt-2 text-[12px] text-[#a8322b]">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => act('apply')}
            className="btn btn-primary !px-3 !py-1.5 !text-[12px]"
          >
            Apply correction
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act('reject')}
            className="btn btn-secondary !px-3 !py-1.5 !text-[12px]"
          >
            Decline
          </button>
        </div>
      </div>
    </article>
  )
}
