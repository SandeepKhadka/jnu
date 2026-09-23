'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { INDIAN_STATES } from '@/content/india'

/**
 * "Education Consultancy Online" — the pulsing call to action in the header, and the
 * form behind it.
 *
 * The button draws attention with a halo rather than a true blink: WCAG 2.3.1
 * treats flashing above three times a second as a seizure risk, and the
 * animation is switched off entirely under prefers-reduced-motion (globals.css).
 *
 * The form posts multipart/form-data to /api/counselling, because a
 * photograph may come with it. Both files are optional — this is a request
 * for a call back, not an admission, and the server is the thing that
 * actually enforces that.
 */
export function CounsellingButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-sand attention-pulse max-sm:px-2.5 max-sm:text-[11px]"
      >
        Education Consultancy Online
      </button>
      {open ? <CounsellingModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}

type Status = { tone: 'ok' | 'err'; text: string } | null

function CounsellingModal({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [done, setDone] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formRef.current) return

    setBusy(true)
    setStatus(null)

    let res: Response
    try {
      res = await fetch('/api/counselling/', {
        method: 'POST',
        body: new FormData(formRef.current),
      })
    } catch {
      setBusy(false)
      setStatus({ tone: 'err', text: 'Could not reach the server. Check your connection and try again.' })
      return
    }

    const data = (await res.json().catch(() => null)) as { reference?: string; error?: string } | null
    setBusy(false)

    if (!res.ok) {
      setStatus({ tone: 'err', text: data?.error ?? 'Something went wrong. Please try again.' })
      return
    }
    setDone(data?.reference ?? '')
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-3xl rounded border border-hair bg-white shadow-chrome focus:outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-hair bg-shell px-5 py-3">
          <h2 id={titleId} className="m-0 font-display text-[16px] uppercase tracking-wide text-jnu-800">
            Education Consultancy Online
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded border border-hair bg-white text-[18px] leading-none text-jnu-700 hover:bg-shell"
          >
            ×
          </button>
        </div>

        {done !== null ? (
          <div className="px-5 py-8 text-center">
            <p className="m-0 text-[15px] font-semibold text-[#2c6549]">Thank you — your request has been received.</p>
            {done ? (
              <p className="m-0 mt-2 text-[13px] text-muted">
                Your reference number is <strong className="tnum text-jnu-800">{done}</strong>. A counsellor
                will contact you on the number you provided.
              </p>
            ) : null}
            <button type="button" onClick={onClose} className="btn btn-primary mt-5">
              Close
            </button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={submit} className="px-5 py-5">
            {status ? (
              <p
                role="alert"
                className={`m-0 mb-4 rounded border px-3 py-2 text-[13px] ${
                  status.tone === 'ok'
                    ? 'border-[#2c6549]/40 bg-[#2c6549]/5 text-[#2c6549]'
                    : 'border-[#a8322b]/40 bg-[#a8322b]/5 text-[#a8322b]'
                }`}
              >
                {status.text}
              </p>
            ) : null}

            {/* Honeypot. Hidden from people, irresistible to bots. */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label htmlFor="cns-company">Company</label>
              <input id="cns-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Counsellor or consultancy name" name="counsellorName" required className="sm:col-span-2" />
              <Field label="First name" name="firstName" required autoComplete="given-name" />
              <Field label="Last name" name="lastName" required autoComplete="family-name" />
              <Field label="Email" name="email" type="email" required autoComplete="email" />
              <Field
                label="Mobile number"
                name="mobile"
                type="tel"
                required
                autoComplete="tel"
                inputMode="numeric"
                hint="10 digits."
              />

              <div>
                <label htmlFor="cns-state" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                  State <span className="text-[#a8322b]">*</span>
                </label>
                <select
                  id="cns-state"
                  name="state"
                  required
                  defaultValue=""
                  className="w-full rounded border border-hair bg-white px-2.5 py-2 text-[13px] focus:border-jnu-400"
                >
                  <option value="" disabled>
                    Select a state
                  </option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <Field label="District" name="district" required />
              <Field label="City or town" name="city" required className="sm:col-span-2" />

              <FileField
                label="Passport-size photograph"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                hint="Optional. JPG, PNG or WebP, up to 2 MB."
              />
              <FileField
                label="Aadhaar card photograph"
                name="aadhaar"
                accept="image/jpeg,image/png,application/pdf"
                hint="Optional. JPG, PNG or PDF, up to 5 MB."
              />
            </div>

            <p className="m-0 mt-4 rounded border border-hair bg-shell px-3 py-2 text-[12px] text-muted">
              Both documents are optional. They are stored privately and are visible only to university
              staff — never published on this website. Please do not send anything you would rather not
              share at this stage.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={busy} className="btn btn-primary">
                {busy ? 'Submitting…' : 'Submit request'}
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  hint,
  className,
  ...rest
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  hint?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `cns-${name}`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-jnu-800">
        {label} {required ? <span className="text-[#a8322b]">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        {...rest}
        className="w-full rounded border border-hair px-2.5 py-2 text-[13px] focus:border-jnu-400"
      />
      {hint ? <p className="m-0 mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  )
}

function FileField({
  label,
  name,
  accept,
  hint,
}: {
  label: string
  name: string
  accept: string
  hint: string
}) {
  const id = `cns-${name}`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-jnu-800">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        className="w-full rounded border border-hair bg-white px-2.5 py-1.5 text-[12px] file:mr-3 file:rounded file:border-0 file:bg-shell file:px-2 file:py-1 file:text-[12px] file:text-jnu-800"
      />
      <p className="m-0 mt-1 text-[11px] text-muted">{hint}</p>
    </div>
  )
}
