'use client'

import QRCode from 'qrcode'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  DEFAULT_CERTIFICATE_LAYOUT,
  type CertificateLayout,
  type FieldBox,
  type StationeryField,
} from '@/lib/content-types'
import { SITE_URL } from '@/lib/site-url'
import { logCertificatePrint, type CertificateRecord } from '@/lib/store'

/**
 * Prints a degree onto the university's pre-printed certificate stationery.
 *
 * Only the values that differ per graduate are printed, at the millimetre
 * positions set under Admin → Certificate layout, plus the verification QR. No
 * border, crest, wording or watermark: all of that is on the blank. The
 * degree is genuine because it is on controlled stationery and signed by
 * hand — this screen supplies the typing, nothing more.
 *
 * Two modes:
 *   - Stationery: the real print. Registrar only, VERIFIED certificates only,
 *     and the server logs it before the print dialog opens, so the audit log
 *     is a count of every blank consumed.
 *   - Alignment test: dashed boxes and labels, no candidate details, for
 *     printing on plain paper and holding over a blank to calibrate.
 *
 * Print isolation matches the other printable documents: portalled to
 * <body>, and body.stationery-printing hides every other child.
 */

type Mode = 'stationery' | 'alignment'

const OFFSET_KEY = 'jnu.stationery.offset'

function readOffset(): { x: number; y: number } {
  try {
    const raw = window.localStorage.getItem(OFFSET_KEY)
    if (!raw) return { x: 0, y: 0 }
    const v = JSON.parse(raw)
    const clamp = (n: unknown) => (typeof n === 'number' && Math.abs(n) <= 20 ? n : 0)
    return { x: clamp(v.x), y: clamp(v.y) }
  } catch {
    return { x: 0, y: 0 }
  }
}

function writeOffset(o: { x: number; y: number }) {
  try {
    window.localStorage.setItem(OFFSET_KEY, JSON.stringify(o))
  } catch {
    // Private mode or blocked storage: the offset simply is not remembered.
  }
}

const LABELS: Record<StationeryField, string> = {
  studentName: 'Student name',
  programme: 'Degree / programme',
  division: 'Division',
  awardYear: 'Year',
  certificateNo: 'Certificate no.',
  enrollmentNo: 'Enrollment no.',
  issuedOn: 'Date of issue',
  serial: 'Serial',
}

function issuedDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}.${m}.${y}` : iso
}

export function StationeryOverlay({
  cert,
  onClose,
  layout = DEFAULT_CERTIFICATE_LAYOUT,
}: {
  cert: CertificateRecord
  onClose: () => void
  /** Millimetre positions on the blank, from Admin → Certificate layout. */
  layout?: CertificateLayout
}) {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<Mode>(cert.status === 'VERIFIED' ? 'stationery' : 'alignment')
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    setOffset(readOffset())
  }, [])

  useEffect(() => {
    document.body.classList.add('stationery-printing')
    const previousTitle = document.title
    document.title = `Degree_${cert.certificate_no}`.replace(/[^\w.-]+/g, '-')
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('stationery-printing')
      document.title = previousTitle
      window.removeEventListener('keydown', onKey)
    }
  }, [cert.certificate_no, onClose])

  function nudge(axis: 'x' | 'y', value: number) {
    const next = { ...offset, [axis]: Math.max(-20, Math.min(20, value)) }
    setOffset(next)
    writeOffset(next)
  }

  async function print() {
    setBusy(true)
    setError(null)
    // Logged server-side first; no log, no print.
    const res = await logCertificatePrint(cert.id, mode)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    window.print()
  }

  if (!mounted) return null

  const canPrintReal = cert.status === 'VERIFIED'

  return createPortal(
    <div
      id="stationery-overlay"
      className="fixed inset-0 z-50 overflow-auto bg-jnu-900/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Print ${cert.certificate_no} on stationery`}
    >
      <div className="no-print mx-auto mb-3 max-w-[297mm] rounded bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold text-jnu-800">{cert.certificate_no}</span>
            <span className="text-muted">— {cert.student_name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={print} disabled={busy} className="btn btn-sand">
              {busy
                ? 'Logging…'
                : mode === 'stationery'
                  ? 'Print on stationery'
                  : 'Print alignment test'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]">
          <fieldset className="m-0 flex gap-3 border-0 p-0">
            <legend className="sr-only">Print mode</legend>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="mode"
                checked={mode === 'stationery'}
                disabled={!canPrintReal}
                onChange={() => setMode('stationery')}
              />
              Degree on stationery
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="mode"
                checked={mode === 'alignment'}
                onChange={() => setMode('alignment')}
              />
              Alignment test (plain paper)
            </label>
          </fieldset>

          <span className="flex items-center gap-2">
            <span className="text-muted">Printer offset (mm):</span>
            <label className="flex items-center gap-1">
              →
              <input
                type="number"
                step={0.5}
                min={-20}
                max={20}
                value={offset.x}
                onChange={(e) => nudge('x', Number(e.target.value) || 0)}
                className="tnum w-16 rounded border border-hair px-1.5 py-0.5"
                aria-label="Horizontal offset in millimetres"
              />
            </label>
            <label className="flex items-center gap-1">
              ↓
              <input
                type="number"
                step={0.5}
                min={-20}
                max={20}
                value={offset.y}
                onChange={(e) => nudge('y', Number(e.target.value) || 0)}
                className="tnum w-16 rounded border border-hair px-1.5 py-0.5"
                aria-label="Vertical offset in millimetres"
              />
            </label>
          </span>
        </div>

        {!canPrintReal ? (
          <p className="m-0 mt-2 text-[12px] text-[#a8322b]">
            This certificate is {cert.status.toLowerCase()} and cannot be printed on stationery.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="m-0 mt-2 text-[12px] text-[#a8322b]">
            {error}
          </p>
        ) : null}

        <p className="m-0 mt-2 text-[11.5px] text-muted">
          In the print dialog set <strong>Scale: 100%</strong> (not &ldquo;Fit to page&rdquo;),
          paper <strong>A4 landscape</strong>, margins <strong>None</strong>. Every print is
          recorded in the audit log.
        </p>
      </div>

      <StationeryPage cert={cert} mode={mode} offset={offset} layout={layout} />
    </div>,
    document.body
  )
}

function StationeryPage({
  cert,
  mode,
  offset,
  layout,
}: {
  cert: CertificateRecord
  mode: Mode
  offset: { x: number; y: number }
  layout: CertificateLayout
}) {
  const [qr, setQr] = useState<string | null>(null)
  const verifyUrl = cert.serial
    ? `${SITE_URL}/verify/certificate/?sn=${encodeURIComponent(cert.serial)}`
    : null

  useEffect(() => {
    if (!verifyUrl || mode === 'alignment') {
      setQr(null)
      return
    }
    let cancelled = false
    QRCode.toString(verifyUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' })
      .then((svg) => {
        if (!cancelled) setQr(svg)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [verifyUrl, mode])

  const values: Record<StationeryField, string> = {
    studentName: cert.student_name,
    programme: cert.programme,
    division: cert.division,
    awardYear: String(cert.award_year),
    certificateNo: cert.certificate_no,
    enrollmentNo: cert.enrollment_no,
    issuedOn: issuedDate(cert.issued_on),
    serial: cert.serial ?? '',
  }

  const q = layout.qr

  return (
    <div
      className={`stationery-page ${mode === 'alignment' ? 'is-alignment' : ''}`}
      style={{ width: `${layout.page.width}mm`, height: `${layout.page.height}mm` }}
    >
      {mode === 'alignment' ? (
        <>
          <p className="stationery-alignment-title">
            ALIGNMENT TEST — PRINT ON PLAIN PAPER — NOT A CERTIFICATE
          </p>
          {/* Corner marks, to check the printer is not scaling the page. */}
          <span className="stationery-corner" style={{ left: '10mm', top: '10mm' }} />
          <span className="stationery-corner" style={{ right: '10mm', top: '10mm' }} />
          <span className="stationery-corner" style={{ left: '10mm', bottom: '10mm' }} />
          <span className="stationery-corner" style={{ right: '10mm', bottom: '10mm' }} />
        </>
      ) : null}

      {(Object.keys(layout.fields) as StationeryField[]).map((key) => (
        <Field
          key={key}
          box={layout.fields[key]}
          offset={offset}
          text={mode === 'alignment' ? LABELS[key] : values[key]}
          outline={mode === 'alignment'}
        />
      ))}

      <div
        className={`stationery-qr ${mode === 'alignment' ? 'is-outline' : ''}`}
        style={{
          left: `${q.x + offset.x}mm`,
          top: `${q.y + offset.y}mm`,
          width: `${q.size}mm`,
          height: `${q.size}mm`,
        }}
      >
        {mode === 'alignment' ? (
          <span>QR</span>
        ) : qr ? (
          <div dangerouslySetInnerHTML={{ __html: qr }} />
        ) : null}
      </div>
    </div>
  )
}

/**
 * One positioned value. Shrinks its font until the text fits the box, so a
 * long name stays on its line instead of running across the blank's artwork.
 */
function Field({
  box,
  offset,
  text,
  outline,
}: {
  box: FieldBox
  offset: { x: number; y: number }
  text: string
  outline: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(box.size)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let s = box.size
    el.style.fontSize = `${s}pt`
    while (el.scrollWidth > el.clientWidth + 0.5 && s > box.size * 0.6) {
      s -= 0.5
      el.style.fontSize = `${s}pt`
    }
    setSize(s)
  }, [text, box.size])

  return (
    <div
      ref={ref}
      className={`stationery-field ${outline ? 'is-outline' : ''}`}
      style={{
        left: `${box.x + offset.x}mm`,
        top: `${box.y + offset.y}mm`,
        width: `${box.w}mm`,
        textAlign: box.align,
        fontSize: `${size}pt`,
        fontWeight: box.bold ? 700 : 400,
        fontStyle: box.italic ? 'italic' : 'normal',
        textTransform: box.caps ? 'uppercase' : 'none',
      }}
    >
      {box.prefix && !outline ? box.prefix : ''}
      {text}
    </div>
  )
}
