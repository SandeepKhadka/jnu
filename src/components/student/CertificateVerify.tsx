'use client'

import { useState } from 'react'
import { findCertificate, type CertificateRecord } from '@/lib/store'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; row: CertificateRecord }
  | { kind: 'notfound'; no: string }

/**
 * Verification: a third party enters a certificate number and learns whether
 * it exists in the register. A number not on record returns NOT VERIFIED, and
 * a revoked one says so explicitly — the point of a register is that a
 * withdrawn credential must not read as valid.
 */
export function CertificateVerify() {
  const [no, setNo] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const value = no.trim().toUpperCase()
    if (!value) return

    setState({ kind: 'loading' })
    const row = await findCertificate(value)

    setState(row ? { kind: 'found', row } : { kind: 'notfound', no: value })
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="panel no-print mb-6">
        <h2 className="panel-head m-0">Verify a Certificate</h2>
        <div className="panel-body">
          <label htmlFor="certno" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
            Certificate Number
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="certno"
              type="text"
              autoComplete="off"
              required
              maxLength={40}
              value={no}
              onChange={(e) => setNo(e.target.value)}
              placeholder="JNU/DEG/2024/004512"
              aria-describedby="certno-help"
              className="w-full max-w-[320px] rounded border border-hair px-3 py-2 text-[14px] uppercase tracking-wide focus:border-jnu-400"
            />
            <button type="submit" className="btn btn-primary" disabled={state.kind === 'loading'}>
              {state.kind === 'loading' ? 'Checking…' : 'Verify'}
            </button>
          </div>
          <p id="certno-help" className="m-0 mt-2 text-xs text-muted">
            Enter the number exactly as printed on the certificate, including slashes.
            Employers and institutions may use this service without an account.
          </p>

          <p className="m-0 mt-3 rounded border border-hair bg-shell px-3 py-2 text-xs text-muted">
            <strong className="text-jnu-800">Sample numbers: </strong>
            <button type="button" onClick={() => setNo('JNU/DEG/2024/004512')} className="underline">
              JNU/DEG/2024/004512
            </button>
            {' · '}
            <button type="button" onClick={() => setNo('JNU/DEG/2022/003310')} className="underline">
              JNU/DEG/2022/003310
            </button>{' '}
            (revoked)
            {' · '}
            <button type="button" onClick={() => setNo('JNU/DEG/2025/005190')} className="underline">
              JNU/DEG/2025/005190
            </button>{' '}
            (withheld)
          </p>
        </div>
      </form>

      <div aria-live="polite">
        {state.kind === 'found' ? <Outcome row={state.row} /> : null}

        {state.kind === 'notfound' ? (
          <div className="panel border-l-[3px] border-l-[#a8322b] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Not verified</p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Certificate number <span className="tnum font-semibold">{state.no}</span> is not
              present in the university record. Check the number for transcription errors. If
              it is correct as printed, contact the registrar via the{' '}
              <a href="/contact/">contact page</a> before relying on the document.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Outcome({ row }: { row: CertificateRecord }) {
  const tone =
    row.status === 'VERIFIED'
      ? { c: '#2c6549', label: 'Verified' }
      : row.status === 'REVOKED'
        ? { c: '#a8322b', label: 'Revoked' }
        : { c: '#9a6a10', label: 'Withheld' }

  return (
    <article className="panel" style={{ borderLeft: `3px solid ${tone.c}` }}>
      <h2 className="panel-head m-0 flex flex-wrap items-center justify-between gap-2">
        <span>Verification Result</span>
        <span
          className="rounded-sm border px-2 py-0.5 text-[11px] uppercase tracking-wide"
          style={{ borderColor: tone.c, color: tone.c }}
        >
          {tone.label}
        </span>
      </h2>

      <div className="panel-body">
        {row.status === 'REVOKED' ? (
          <p className="m-0 mb-4 text-[13.5px] font-semibold text-[#a8322b]">
            This certificate was issued but has since been withdrawn by the university. It
            must not be accepted as a valid credential.
          </p>
        ) : null}

        {row.status === 'WITHHELD' ? (
          <p className="m-0 mb-4 text-[13.5px] font-semibold text-[#9a6a10]">
            This record is under review by the registrar. Contact the university before
            relying on this document.
          </p>
        ) : null}

        <dl className="m-0 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <Field label="Certificate No." value={row.certificate_no} mono bold />
          <Field label="Name" value={row.student_name} bold />
          <Field label="Programme" value={row.programme} />
          <Field label="Year of Award" value={String(row.award_year)} mono />
          <Field label="Enrollment No." value={row.enrollment_no} mono />
          <Field label="Division" value={row.division} />
        </dl>

        {row.registrar_remarks ? (
          <p className="m-0 mt-4 text-[13px] text-muted">
            <span className="font-semibold text-jnu-800">Registrar&rsquo;s remarks: </span>
            {row.registrar_remarks}
          </p>
        ) : null}

        <p className="m-0 mt-4 text-xs text-muted">
          This response reflects the university record at the time of the query. It confirms
          the existence and status of a record only; it does not itself constitute a
          certificate.
        </p>

        <p className="no-print m-0 mt-4">
          <button type="button" onClick={() => window.print()} className="btn btn-secondary">
            Print
          </button>
        </p>
      </div>
    </article>
  )
}

function Field({
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
      <dd className={`m-0 ${mono ? 'tnum' : ''} ${bold ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  )
}
