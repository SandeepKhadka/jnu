'use client'

import { useRef, useState } from 'react'

import { INDIAN_STATES } from '@/content/india'
import { formatNoticeDate } from '@/lib/content-types'
import { CORRECTABLE_FIELDS, type CorrectableField } from '@/lib/corrections'
import {
  requestCorrection,
  updateContactDetails,
  uploadStudentPhoto,
  withdrawStudentPhoto,
  type ContactDetails,
  type CorrectionRequest,
  type StudentProfile,
} from '@/lib/store'

/**
 * The student's own profile, with the three kinds of change they can make:
 *
 *   1. Photograph — uploaded here, but held as PENDING until staff approve it.
 *      The current photo stays on the record until then.
 *   2. Contact details — edited directly. These are the only fields a student
 *      may change themselves.
 *   3. Identity fields (name, parents' names, date of birth, programme) —
 *      read-only, each with "Request correction", which files a request for
 *      the registrar. These are what certificate verification checks against,
 *      so a student who could edit them could align their record to a forged
 *      certificate and have the register confirm it.
 *
 * Roll and enrollment numbers are neither editable nor correctable here: they
 * are the keys results and certificates hang off.
 */
export function ProfilePanel({
  profile,
  corrections,
  onChanged,
}: {
  profile: StudentProfile
  corrections: CorrectionRequest[]
  onChanged: () => Promise<void>
}) {
  const pendingFor = (field: CorrectableField) =>
    corrections.find((c) => c.field === field && c.status === 'PENDING')

  return (
    <>
      <article className="panel">
        <h2 className="panel-head m-0">Candidate Details</h2>
        <div className="panel-body">
          <div className="flex flex-wrap gap-6">
            <PhotoBlock profile={profile} onChanged={onChanged} />

            <div className="min-w-0 flex-1">
              <dl className="m-0 grid gap-x-6 gap-y-2.5 text-[13.5px] sm:grid-cols-2">
                <Locked label="Roll Number" value={profile.rollNo} mono bold />
                <Locked label="Enrollment No." value={profile.enrollmentNo} mono bold />
                <Correctable
                  field="fullName"
                  value={profile.fullName}
                  pending={pendingFor('fullName')}
                  onChanged={onChanged}
                  bold
                />
                <Correctable
                  field="programme"
                  value={profile.programme}
                  pending={pendingFor('programme')}
                  onChanged={onChanged}
                />
                <Correctable
                  field="fatherName"
                  value={profile.fatherName}
                  pending={pendingFor('fatherName')}
                  onChanged={onChanged}
                />
                <Correctable
                  field="motherName"
                  value={profile.motherName}
                  pending={pendingFor('motherName')}
                  onChanged={onChanged}
                />
                <Correctable
                  field="dob"
                  value={profile.dob}
                  display={formatNoticeDate(profile.dob)}
                  pending={pendingFor('dob')}
                  onChanged={onChanged}
                  mono
                />
                <Locked label="Status" value={profile.status} />
              </dl>

              <p className="m-0 mt-4 text-xs text-muted">
                <span aria-hidden="true">🔒 </span>
                These details are held by the registrar and can only be changed on request.
                They are what employers check when verifying your certificate.
              </p>
            </div>
          </div>
        </div>
      </article>

      <ContactBlock profile={profile} onChanged={onChanged} />

      {corrections.length > 0 ? <CorrectionHistory corrections={corrections} /> : null}
    </>
  )
}

/* -------------------------------------------------------------- photo --- */

function PhotoBlock({
  profile,
  onChanged,
}: {
  profile: StudentProfile
  onChanged: () => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file after an error
    if (!file) return

    // Early, friendly checks. The server re-validates by magic number, which
    // is the check that actually matters.
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('The photograph must be 2 MB or smaller.')
      return
    }

    setBusy(true)
    setError(null)
    const res = await uploadStudentPhoto(file)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    await onChanged()
  }

  async function withdraw() {
    setBusy(true)
    await withdrawStudentPhoto()
    setBusy(false)
    await onChanged()
  }

  return (
    <div className="w-[128px] shrink-0">
      {/* Served from /api/uploads/<id>, which checks the session. next/image
          is not used because the route is authenticated and no-store. */}
      {profile.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.photoUrl}
          alt={`Photograph of ${profile.fullName}`}
          width={128}
          height={160}
          className="h-[160px] w-[128px] rounded border border-hair object-cover"
        />
      ) : (
        <div className="grid h-[160px] w-[128px] place-items-center rounded border border-dashed border-hair px-2 text-center text-[11px] text-muted">
          No photograph on record
        </div>
      )}

      {profile.pendingPhotoUrl ? (
        <div className="mt-3 rounded border border-[#9a6a10] bg-[#fdf8ee] p-2">
          <p className="m-0 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9a6a10]">
            Awaiting approval
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.pendingPhotoUrl}
            alt="Your new photograph, awaiting approval"
            width={112}
            height={140}
            className="h-[140px] w-full rounded border border-hair object-cover"
          />
          <button
            type="button"
            onClick={withdraw}
            disabled={busy}
            className="mt-1.5 text-[11px] text-[#a8322b] underline"
          >
            Withdraw
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="btn btn-secondary mt-2 w-full !px-2 !py-1.5 !text-[11px]"
      >
        {busy
          ? 'Uploading…'
          : profile.pendingPhotoUrl
            ? 'Replace upload'
            : profile.photoUrl
              ? 'Change photo'
              : 'Add photo'}
      </button>

      {error ? (
        <p role="alert" className="m-0 mt-1.5 text-[11px] text-[#a8322b]">
          {error}
        </p>
      ) : (
        <p className="m-0 mt-1.5 text-[10.5px] leading-snug text-muted">
          A new photo appears once staff approve it.
        </p>
      )}
    </div>
  )
}

/* ----------------------------------------------------- identity fields --- */

function Locked({
  label,
  value,
  mono = false,
  bold = false,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted">{label}</dt>
      <dd className={`m-0 min-w-0 ${mono ? 'tnum' : ''} ${bold ? 'font-semibold' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

function Correctable({
  field,
  value,
  display,
  pending,
  onChanged,
  mono = false,
  bold = false,
}: {
  field: CorrectableField
  value: string
  display?: string
  pending?: CorrectionRequest
  onChanged: () => Promise<void>
  mono?: boolean
  bold?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const label = CORRECTABLE_FIELDS[field]
  const inputId = `corr-${field}`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await requestCorrection({ field, requestedValue: requested, reason })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setOpen(false)
    setRequested('')
    setReason('')
    await onChanged()
  }

  return (
    <div className="min-w-0">
      <div className="flex gap-2">
        <dt className="w-32 shrink-0 text-muted">{label}</dt>
        <dd className={`m-0 min-w-0 ${mono ? 'tnum' : ''} ${bold ? 'font-semibold' : ''}`}>
          {display ?? value}
          <span className="ml-1.5 text-[10px] text-muted" aria-label="Locked">
            🔒
          </span>
        </dd>
      </div>

      <div className="no-print ml-[136px]">
        {pending ? (
          <p className="m-0 mt-0.5 text-[11px] text-[#9a6a10]">
            Correction requested: &ldquo;{pending.requestedValue}&rdquo;
          </p>
        ) : open ? (
          <form onSubmit={submit} className="mt-1.5 rounded border border-hair bg-shell p-2.5">
            <label htmlFor={inputId} className="mb-1 block text-[11px] font-semibold text-jnu-800">
              Correct {label.toLowerCase()}
            </label>
            <input
              id={inputId}
              type={field === 'dob' ? 'date' : 'text'}
              required
              maxLength={120}
              value={requested}
              onChange={(e) => setRequested(e.target.value)}
              className="mb-2 w-full rounded border border-hair bg-white px-2 py-1 text-[13px]"
            />
            <label
              htmlFor={`${inputId}-why`}
              className="mb-1 block text-[11px] font-semibold text-jnu-800"
            >
              Reason <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id={`${inputId}-why`}
              type="text"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. spelling on my Class 10 certificate"
              className="mb-2 w-full rounded border border-hair bg-white px-2 py-1 text-[13px]"
            />
            {error ? (
              <p role="alert" className="m-0 mb-2 text-[11px] text-[#a8322b]">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn btn-primary !px-3 !py-1 !text-[11px]">
                {busy ? 'Sending…' : 'Send request'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setError(null)
                }}
                className="btn btn-secondary !px-3 !py-1 !text-[11px]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-0.5 text-[11px] text-jnu-700 underline"
          >
            Request correction
          </button>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- contact --- */

function ContactBlock({
  profile,
  onChanged,
}: {
  profile: StudentProfile
  onChanged: () => Promise<void>
}) {
  const initial: ContactDetails = {
    mobile: profile.mobile ?? '',
    email: profile.email ?? '',
    addressLine: profile.addressLine ?? '',
    district: profile.district ?? '',
    state: profile.state ?? '',
    pincode: profile.pincode ?? '',
  }

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ContactDetails>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof ContactDetails>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await updateContactDetails(form)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditing(false)
    setSaved(true)
    await onChanged()
  }

  const address = [profile.addressLine, profile.district, profile.state, profile.pincode]
    .filter(Boolean)
    .join(', ')

  return (
    <article className="panel mt-5">
      <h2 className="panel-head m-0 flex items-center justify-between gap-2">
        <span>Contact Details</span>
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setForm(initial)
              setEditing(true)
              setSaved(false)
            }}
            className="no-print text-[12px] font-semibold normal-case tracking-normal text-jnu-700 underline"
          >
            Edit
          </button>
        ) : null}
      </h2>

      <div className="panel-body">
        {!editing ? (
          <>
            <dl className="m-0 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
              <Locked label="Mobile" value={profile.mobile ?? 'Not given'} mono />
              <Locked label="Email" value={profile.email ?? 'Not given'} />
              <div className="sm:col-span-2">
                <Locked label="Address" value={address || 'Not given'} />
              </div>
            </dl>
            {saved ? (
              <p role="status" className="m-0 mt-3 text-[12px] text-[#2c6549]">
                Contact details saved.
              </p>
            ) : null}
          </>
        ) : (
          <form onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="c-mobile"
                label="Mobile number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={form.mobile}
                onChange={(v) => set('mobile', v)}
                placeholder="9876543210"
              />
              <Input
                id="c-email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(v) => set('email', v)}
              />
              <div className="sm:col-span-2">
                <label htmlFor="c-address" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
                  Address
                </label>
                <textarea
                  id="c-address"
                  rows={2}
                  maxLength={500}
                  autoComplete="street-address"
                  value={form.addressLine}
                  onChange={(e) => set('addressLine', e.target.value)}
                  className="w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
                />
              </div>
              <Input
                id="c-district"
                label="District"
                value={form.district}
                onChange={(v) => set('district', v)}
                maxLength={80}
              />
              <div>
                <label htmlFor="c-state" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
                  State / Union territory
                </label>
                <select
                  id="c-state"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  className="w-full rounded border border-hair bg-white px-3 py-2 text-[14px] focus:border-jnu-400"
                >
                  <option value="">—</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                id="c-pincode"
                label="PIN code"
                inputMode="numeric"
                value={form.pincode}
                onChange={(v) => set('pincode', v)}
                maxLength={6}
                placeholder="342003"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="m-0 mt-4 rounded border border-[#a8322b] bg-[#fdf4f3] px-3 py-2 text-[13px] text-[#a8322b]"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={busy} className="btn btn-primary">
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setError(null)
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  )
}

function Input({
  id,
  label,
  value,
  onChange,
  ...rest
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'id'>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
        {...rest}
      />
    </div>
  )
}

/* ------------------------------------------------- correction history --- */

function CorrectionHistory({ corrections }: { corrections: CorrectionRequest[] }) {
  const tone = {
    PENDING: 'text-[#9a6a10] border-[#9a6a10]',
    RESOLVED: 'text-[#2c6549] border-[#2c6549]',
    REJECTED: 'text-[#a8322b] border-[#a8322b]',
  } as const
  const word = { PENDING: 'Pending', RESOLVED: 'Corrected', REJECTED: 'Declined' } as const

  return (
    <article className="panel no-print mt-5">
      <h2 className="panel-head m-0">Correction Requests</h2>
      <div className="panel-body p-0">
        <ul className="m-0 list-none p-0">
          {corrections.map((c) => (
            <li key={c.id} className="border-b border-hair px-4 py-3 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px]">
                  <span className="font-semibold text-jnu-800">
                    {CORRECTABLE_FIELDS[c.field as CorrectableField] ?? c.field}
                  </span>
                  : &ldquo;{c.currentValue}&rdquo; → &ldquo;{c.requestedValue}&rdquo;
                </span>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${tone[c.status]}`}
                >
                  {word[c.status]}
                </span>
              </div>
              <p className="tnum m-0 mt-0.5 text-[11px] text-muted">
                Requested {formatNoticeDate(c.createdAt.slice(0, 10))}
              </p>
              {c.staffRemarks ? (
                <p className="m-0 mt-1 text-[12px] text-muted">
                  <span className="font-semibold">Registrar: </span>
                  {c.staffRemarks}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
