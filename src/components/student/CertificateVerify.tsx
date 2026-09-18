'use client'

import { useState } from 'react'

import { useSite } from '@/components/site/SiteProvider'
import { verifyCertificate, type CertificateRecord, type VerifyOutcome } from '@/lib/store'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; outcome: VerifyOutcome; roll: string }

/**
 * Verification by roll number + date of birth.
 *
 * A third party enters the pair and learns whether a certificate exists in the
 * register and what its status is. A revoked certificate says so explicitly —
 * the whole point of a register is that a withdrawn credential must not read
 * as valid.
 *
 * The request is a POST, so the roll number and date of birth never appear in
 * a URL, a browser history entry or a Referer header, and the route behind it
 * is rate limited: unlike a certificate number, this pair is guessable.
 */
export function CertificateVerify() {
  const { site } = useSite()
  const [roll, setRoll] = useState('')
  const [dob, setDob] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const value = roll.trim().toUpperCase()
    if (!value || !dob) return

    setState({ kind: 'loading' })
    const outcome = await verifyCertificate(value, dob)
    setState({ kind: 'done', outcome, roll: value })
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="panel no-print mb-6">
        <h2 className="panel-head m-0">Verify a Certificate</h2>
        <div className="panel-body">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="v-roll"
                className="mb-1.5 block text-[13px] font-semibold text-jnu-800"
              >
                Roll Number
              </label>
              <input
                id="v-roll"
                type="text"
                autoComplete="off"
                required
                maxLength={24}
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="JNU2024BT0147"
                className="w-full rounded border border-hair px-3 py-2 text-[14px] uppercase tracking-wide focus:border-jnu-400"
              />
            </div>
            <div>
              <label
                htmlFor="v-dob"
                className="mb-1.5 block text-[13px] font-semibold text-jnu-800"
              >
                Date of Birth
              </label>
              <input
                id="v-dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="tnum w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
              />
            </div>
          </div>

          <p className="m-0 mt-3 text-xs text-muted">
            Enter the roll number and date of birth exactly as they appear on the
            certificate. Employers and institutions may use this service without an
            account.
          </p>

          <p className="m-0 mt-4">
            <button type="submit" className="btn btn-primary" disabled={state.kind === 'loading'}>
              {state.kind === 'loading' ? 'Checking…' : 'Verify'}
            </button>
          </p>

          {/* Requested plainly on the page: where to write for a signed notice. */}
          <p className="m-0 mt-4 rounded border border-hair bg-shell px-3 py-2 text-[13px] text-muted">
            For a signed verification notice on university letterhead, write to{' '}
            <a href={`mailto:${site.verificationEmail}`} className="font-semibold">
              {site.verificationEmail}
            </a>{' '}
            quoting the roll number and date of birth.
          </p>
        </div>
      </form>

      <div aria-live="polite">
        {state.kind === 'done' ? <Result state={state} /> : null}
      </div>
    </div>
  )
}

function Result({ state }: { state: { outcome: VerifyOutcome; roll: string } }) {
  const { site } = useSite()
  const { outcome, roll } = state

  if (outcome.kind === 'found') return <Outcome row={outcome.row} />

  if (outcome.kind === 'error') {
    return (
      <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
        <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">Could not check</p>
        <p className="m-0 mt-1 text-[13px] text-muted">{outcome.error}</p>
      </div>
    )
  }

  // A student on record but with nothing awarded yet is a different and more
  // useful answer to an employer than "no such person".
  if (outcome.kind === 'no-certificate') {
    return (
      <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
        <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">No certificate issued</p>
        <p className="m-0 mt-1 text-[13px] text-muted">
          Roll number <span className="tnum font-semibold">{roll}</span> is on the university
          record, but no certificate has been issued against it. This is normal for a student
          who has not yet completed their programme. For written confirmation, contact{' '}
          <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="panel border-l-[3px] border-l-[#a8322b] p-4">
      <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Not verified</p>
      <p className="m-0 mt-1 text-[13px] text-muted">
        No record matches roll number <span className="tnum font-semibold">{roll}</span> with
        the date of birth given. Check both for transcription errors — the date of birth must
        match the university record exactly. If they are correct as printed, contact{' '}
        <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a> before
        relying on the document.
      </p>
    </div>
  )
}

function Outcome({ row }: { row: CertificateRecord }) {
  const { site } = useSite()
  const tone =
    row.status === 'VERIFIED'
      ? { c: '#2c6549', label: 'Verified' }
      : row.status === 'REVOKED'
        ? { c: '#a8322b', label: 'Revoked' }
        : { c: '#9a6a10', label: 'Withheld' }

  return (
    // data-print-scope: printing this page prints only this result — no site
    // header, navigation, footer or explanatory text (see globals.css).
    <article
      className="panel"
      style={{ borderLeft: `3px solid ${tone.c}` }}
      data-print-scope
    >
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
          certificate. For a signed notice, write to{' '}
          <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a>.
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
