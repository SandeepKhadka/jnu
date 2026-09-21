'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The admin panel's shared controls.
 *
 * Plain, dense and consistent: this is a tool people use all day, so every
 * screen uses the same field, button, table and status message rather than
 * each inventing its own.
 */

/* ------------------------------------------------------------- layout --- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-hair pb-4">
      <div className="min-w-0">
        <h1 className="m-0 font-display text-[22px] text-jnu-800">{title}</h1>
        {description ? <p className="m-0 mt-1 max-w-2xl text-[13px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function Card({
  title,
  description,
  children,
  actions,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <section className="mb-5 rounded border border-hair bg-white">
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hair bg-shell px-4 py-2.5">
          <div>
            <h2 className="m-0 font-display text-[14px] uppercase tracking-wide text-jnu-800">{title}</h2>
            {description ? <p className="m-0 mt-0.5 text-[12px] text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const c = cols === 1 ? '' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  return <div className={`grid gap-4 ${c}`}>{children}</div>
}

/* ------------------------------------------------------------- fields --- */

export function Field({
  label,
  hint,
  required,
  children,
  full,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <label className={`block ${full ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <span className="mb-1 block text-[12px] font-semibold text-jnu-800">
        {label}
        {required ? <span className="ml-0.5 text-[#a8322b]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] leading-snug text-muted">{hint}</span> : null}
    </label>
  )
}

const inputClass =
  'w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400 focus:outline-none disabled:bg-shell disabled:text-muted'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Select({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select {...props} className={`${inputClass} bg-white ${props.className ?? ''}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Check({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-[13px]">
      <input type="checkbox" {...props} className="mt-0.5" />
      <span>
        {label}
        {hint ? <span className="block text-[11.5px] text-muted">{hint}</span> : null}
      </span>
    </label>
  )
}

/** Edits a list of strings: address lines, objectives, FAQ answers. */
export function StringList({
  values,
  onChange,
  placeholder,
  addLabel = 'Add line',
  textarea,
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
  textarea?: boolean
}) {
  const Comp = textarea ? Textarea : Input
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Comp
            value={v}
            placeholder={placeholder}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange(values.map((x, j) => (i === j ? e.target.value : x)))
            }
          />
          <div className="flex shrink-0 flex-col gap-1">
            <IconButton label="Move up" onClick={() => i > 0 && onChange(swap(values, i, i - 1))}>
              ↑
            </IconButton>
            <IconButton label="Move down" onClick={() => i < values.length - 1 && onChange(swap(values, i, i + 1))}>
              ↓
            </IconButton>
            <IconButton label="Remove" danger onClick={() => onChange(values.filter((_, j) => j !== i))}>
              ×
            </IconButton>
          </div>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...values, ''])}>
        {addLabel}
      </Button>
    </div>
  )
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

/* ------------------------------------------------------------ buttons --- */

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}) {
  const base =
    'inline-flex items-center justify-center rounded border font-semibold uppercase tracking-wide transition-colors disabled:opacity-50'
  const sizes = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12px]'
  const variants = {
    primary: 'border-jnu-600 bg-jnu-600 text-white hover:bg-jnu-700',
    secondary: 'border-hair bg-white text-jnu-800 hover:bg-shell',
    danger: 'border-[#a8322b] bg-white text-[#a8322b] hover:bg-[#fdf4f3]',
    ghost: 'border-transparent bg-transparent text-jnu-700 hover:bg-shell',
  }[variant]
  return (
    <button type="button" {...props} className={`${base} ${sizes} ${variants} ${props.className ?? ''}`}>
      {children}
    </button>
  )
}

export function IconButton({
  label,
  danger,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      {...props}
      className={`grid h-6 w-6 place-items-center rounded border border-hair bg-white text-[12px] leading-none hover:bg-shell ${
        danger ? 'text-[#a8322b]' : 'text-jnu-700'
      } ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

/** A destructive action that asks first, in one control. */
export function ConfirmButton({
  onConfirm,
  question,
  children,
  size = 'sm',
}: {
  onConfirm: () => void | Promise<void>
  question: string
  children: React.ReactNode
  size?: 'sm' | 'md'
}) {
  return (
    <Button
      variant="danger"
      size={size}
      onClick={() => {
        if (window.confirm(question)) void onConfirm()
      }}
    >
      {children}
    </Button>
  )
}

/* ------------------------------------------------------------ status --- */

export type Status = { tone: 'ok' | 'error'; text: string } | null

export function StatusLine({ status }: { status: Status }) {
  if (!status) return null
  return (
    <p
      role={status.tone === 'error' ? 'alert' : 'status'}
      className={`m-0 mb-4 rounded border px-3 py-2 text-[13px] ${
        status.tone === 'ok'
          ? 'border-[#2c6549]/40 bg-[#2c6549]/5 text-[#2c6549]'
          : 'border-[#a8322b]/40 bg-[#a8322b]/5 text-[#a8322b]'
      }`}
    >
      {status.text}
    </p>
  )
}

/** Saves, then confirms — and clears the confirmation after a few seconds. */
export function useStatus() {
  const [status, setStatus] = useState<Status>(null)
  const timer = useRef<number | null>(null)
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])
  function show(next: Status, clearAfterMs = 4000) {
    setStatus(next)
    if (timer.current) window.clearTimeout(timer.current)
    if (next?.tone === 'ok') timer.current = window.setTimeout(() => setStatus(null), clearAfterMs)
  }
  return { status, show, saved: () => show({ tone: 'ok', text: 'Saved. The website has been updated.' }) }
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="m-0 rounded border border-dashed border-hair px-4 py-6 text-center text-[13px] text-muted">{children}</p>
}

export function Loading() {
  return <p className="m-0 py-8 text-[13px] text-muted">Loading…</p>
}

/* ------------------------------------------------------------- table --- */

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap border-b border-hair bg-shell px-3 py-2 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`border-b border-hair px-3 py-2 align-top ${className}`}>{children}</td>
}

export function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted'; children: React.ReactNode }) {
  const c = {
    ok: 'border-[#2c6549] text-[#2c6549]',
    warn: 'border-[#9a6a10] text-[#9a6a10]',
    bad: 'border-[#a8322b] text-[#a8322b]',
    muted: 'border-hair text-muted',
  }[tone]
  return (
    <span className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${c}`}>
      {children}
    </span>
  )
}

/* ------------------------------------------------------------- modal --- */

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`my-8 w-full rounded bg-white shadow-raised ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
        <header className="flex items-center justify-between gap-3 border-b border-hair px-4 py-3">
          <h2 className="m-0 font-display text-[15px] text-jnu-800">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            ×
          </IconButton>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

/**
 * The pagination control every list screen uses.
 *
 * Always states the range and the total ("26–50 of 312") rather than only a
 * page number: on a register of students the question is nearly always "how
 * many are there", and the answer should not require arithmetic.
 *
 * Renders nothing when everything fits on one page — a disabled pager under a
 * six-row table is noise.
 */
export function Pagination({
  page,
  total,
  pageSize,
  onPage,
  unit = 'records',
}: {
  page: number
  total: number
  pageSize: number
  onPage: (p: number) => void
  unit?: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) {
    return total > 0 ? (
      <p className="m-0 mt-3 text-[12px] text-muted">
        {total.toLocaleString('en-IN')} {unit}
      </p>
    ) : null
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hair pt-3">
      <p className="tnum m-0 text-[12px] text-muted">
        {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} {unit}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(1)}>
          « First
        </Button>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹ Previous
        </Button>
        <span className="tnum px-1 text-[12px] text-muted">
          Page {page} of {pages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next ›
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(pages)}>
          Last »
        </Button>
      </div>
    </div>
  )
}
