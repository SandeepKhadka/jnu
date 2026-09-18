'use client'

import { useEffect, useState } from 'react'

import { useSite } from '@/components/site/SiteProvider'
import { findCertificateBySerial, type CertificateBySerial } from '@/lib/store'

type Outcome = Awaited<ReturnType<typeof findCertificateBySerial>>

/**
 * Verifies a printed degree by the serial beside its QR code.
 *
 * From the QR the serial arrives in ?sn= and the check runs at once. The
 * register entry is shown in full, including REVOKED or WITHHELD, which
 * matter most: a degree printed genuinely and later withdrawn must say so to
 * whoever scans it.
 */
export function CertificateSerialVerify() {
  const [serial, setSerial] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  async function run(value: string) {
    if (!value.trim()) return
    setBusy(true)
    setOutcome(await findCertificateBySerial(value))
    setBusy(false)
  }

  useEffect(() => {
    const sn = new URLSearchParams(window.location.search).get('sn')
    if (sn) {
      setSerial(sn)
      void run(sn)
    }
  }, [])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void run(serial)
        }}
        className="panel no-print mb-6"
      >
        <h2 className="panel-head m-0">Verify a Degree Certificate</h2>
        <div className="panel-body">
          <label htmlFor="cs-sn" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
            Serial (printed beside the QR code)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="cs-sn"
              type="text"
              autoComplete="off"
              required
              maxLength={40}
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="JNU-DEG-XXXX-XXXX-XXXX"
              className="tnum w-full max-w-[320px] rounded border border-hair px-3 py-2 text-[14px] uppercase tracking-wide focus:border-jnu-400"
            />
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Checking…' : 'Verify'}
            </button>
          </div>
          <p className="m-0 mt-2 text-xs text-muted">
            Scanning the QR code on the degree fills this in automatically. You can also verify
            by <a href="/verify/">roll number and date of birth</a>.
          </p>
        </div>
      </form>

      <div aria-live="polite">{outcome ? <Result outcome={outcome} /> : null}</div>
    </div>
  )
}

function Result({ outcome }: { outcome: Outcome }) {
  const { site } = useSite()
  if (outcome.kind === 'error') {
    return (
      <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
        <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">Could not check</p>
        <p className="m-0 mt-1 text-[13px] text-muted">{outcome.error}</p>
      </div>
    )
  }

  if (outcome.kind === 'not-found') {
    return (
      <div className="panel border-l-[3px] border-l-[#a8322b] p-4" data-print-scope>
        <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Not verified</p>
        <p className="m-0 mt-1 text-[13px] text-muted">
          No degree with this serial is in the university register. Check the serial for
          transcription errors. If it is correct as printed, the document was not issued by the
          university — contact{' '}
          <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a>.
        </p>
      </div>
    )
  }

  return <Found c={outcome.cert} />
}

function Found({ c }: { c: CertificateBySerial }) {
  const { site } = useSite()
  const tone =
    c.status === 'VERIFIED'
      ? { c: '#2c6549', label: 'Verified' }
      : c.status === 'REVOKED'
        ? { c: '#a8322b', label: 'Revoked' }
        : { c: '#9a6a10', label: 'Withheld' }

  return (
    <article className="panel" style={{ borderLeft: `3px solid ${tone.c}` }} data-print-scope>
      <h2 className="panel-head m-0 flex flex-wrap items-center justify-between gap-2">
        <span>Degree Certificate — Register Entry</span>
        <span
          className="rounded-sm border px-2 py-0.5 text-[11px] uppercase tracking-wide"
          style={{ borderColor: tone.c, color: tone.c }}
        >
          {tone.label}
        </span>
      </h2>
      <div className="panel-body">
        {c.status === 'REVOKED' ? (
          <p className="m-0 mb-4 text-[13.5px] font-semibold text-[#a8322b]">
            This degree was issued but has since been withdrawn by the university. It must not
            be accepted as a valid credential.
          </p>
        ) : null}
        {c.status === 'WITHHELD' ? (
          <p className="m-0 mb-4 text-[13.5px] font-semibold text-[#9a6a10]">
            This record is under review by the registrar. Contact the university before relying
            on this document.
          </p>
        ) : null}

        <dl className="m-0 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <Row label="Serial" value={c.serial} mono bold />
          <Row label="Certificate No." value={c.certificateNo} mono bold />
          <Row label="Name" value={c.studentName} bold />
          <Row label="Programme" value={c.programme} />
          <Row label="Division" value={c.division} />
          <Row label="Year of Award" value={String(c.awardYear)} mono />
          <Row label="Enrollment No." value={c.enrollmentNo} mono />
        </dl>

        {c.registrarRemarks ? (
          <p className="m-0 mt-4 text-[13px] text-muted">
            <span className="font-semibold text-jnu-800">Registrar&rsquo;s remarks: </span>
            {c.registrarRemarks}
          </p>
        ) : null}

        <p className="m-0 mt-4 text-xs text-muted">
          Compare every detail with the printed degree. This response reflects the university
          register at the time of the query. For a signed verification notice, write to{' '}
          <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a>.
        </p>
      </div>
    </article>
  )
}

function Row({
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
      <dd className={`m-0 min-w-0 ${mono ? 'tnum' : ''} ${bold ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  )
}
