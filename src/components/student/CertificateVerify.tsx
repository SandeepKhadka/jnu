'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

type CertRow = {
  certificate_no: string
  student_name: string
  programme: string
  award_year: number
  enrollment_no: string | null
  status: 'VERIFIED' | 'REVOKED' | 'WITHHELD'
  registrar_remarks: string | null
}

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; row: CertRow }
  | { kind: 'notfound'; no: string }
  | { kind: 'error' }
  | { kind: 'unconfigured' }

/**
 * Verification, not issuance.
 *
 * A third party enters a certificate number and learns whether it exists in
 * the registrar's record. A number not in the record returns NOT VERIFIED, and
 * a revoked one says so explicitly rather than staying silent — the whole
 * point is that a withdrawn credential must not read as valid.
 */
export function CertificateVerify() {
  const [no, setNo] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const value = no.trim().toUpperCase()
    if (!value) return

    const supabase = getSupabase()
    if (!supabase) {
      setState({ kind: 'unconfigured' })
      return
    }

    setState({ kind: 'loading' })

    const { data, error } = await supabase
      .from('certificates')
      .select(
        'certificate_no, student_name, programme, award_year, enrollment_no, status, registrar_remarks'
      )
      .eq('certificate_no', value)
      .maybeSingle()

    if (error) {
      setState({ kind: 'error' })
      return
    }

    if (!data) {
      setState({ kind: 'notfound', no: value })
      return
    }

    setState({ kind: 'found', row: data as CertRow })
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
              placeholder="e.g. JNU/DEG/2016/004512"
              aria-describedby="certno-help"
              className="w-full max-w-[320px] rounded border border-hair px-3 py-2 text-[14px] uppercase tracking-wide focus:border-jnu-400"
            />
            <button type="submit" className="btn btn-primary" disabled={state.kind === 'loading'}>
              {state.kind === 'loading' ? 'Checking…' : 'Verify'}
            </button>
          </div>
          <p id="certno-help" className="m-0 mt-2 text-xs text-muted">
            Enter the number exactly as printed on the certificate, including any
            slashes. Employers and institutions may use this service without an account.
          </p>
        </div>
      </form>

      <div aria-live="polite">
        {state.kind === 'found' ? <Outcome row={state.row} /> : null}

        {state.kind === 'notfound' ? (
          <div className="panel border-l-[3px] border-l-[#a8322b] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Not verified</p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Certificate number{' '}
              <span className="tnum font-semibold">{state.no}</span> is not present in the
              university record. Check the number for transcription errors. If it is
              correct as printed, contact the registrar at the address on the{' '}
              <a href="/contact/">contact page</a> before relying on the document.
            </p>
          </div>
        ) : null}

        {state.kind === 'error' ? (
          <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">Service unavailable</p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              The verification service could not be reached. Please try again.
            </p>
          </div>
        ) : null}

        {state.kind === 'unconfigured' ? (
          <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">
              Verification service not configured
            </p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Set the Supabase environment variables and run{' '}
              <code>supabase/schema.sql</code>. See the README.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Outcome({ row }: { row: CertRow }) {
  const tone =
    row.status === 'VERIFIED'
      ? { border: '#2c6549', label: 'Verified', text: '#2c6549' }
      : row.status === 'REVOKED'
        ? { border: '#a8322b', label: 'Revoked', text: '#a8322b' }
        : { border: '#9a6a10', label: 'Withheld', text: '#9a6a10' }

  return (
    <article className="panel" style={{ borderLeft: `3px solid ${tone.border}` }}>
      <h2 className="panel-head m-0 flex flex-wrap items-center justify-between gap-2">
        <span>Verification Result</span>
        <span
          className="rounded-sm border px-2 py-0.5 text-[11px] uppercase tracking-wide"
          style={{ borderColor: tone.border, color: tone.text }}
        >
          {tone.label}
        </span>
      </h2>

      <div className="panel-body">
        {row.status === 'REVOKED' ? (
          <p className="m-0 mb-4 text-[13.5px] font-semibold text-[#a8322b]">
            This certificate was issued but has since been withdrawn by the university.
            It must not be accepted as a valid credential.
          </p>
        ) : null}

        {row.status === 'WITHHELD' ? (
          <p className="m-0 mb-4 text-[13.5px] font-semibold text-[#9a6a10]">
            This record is under review by the registrar. Contact the university before
            relying on this document.
          </p>
        ) : null}

        <dl className="m-0 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-muted">Certificate No.</dt>
            <dd className="tnum m-0 font-semibold">{row.certificate_no}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-muted">Name</dt>
            <dd className="m-0 font-semibold">{row.student_name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-muted">Programme</dt>
            <dd className="m-0">{row.programme}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-muted">Year of Award</dt>
            <dd className="tnum m-0">{row.award_year}</dd>
          </div>
          {row.enrollment_no ? (
            <div className="flex gap-2">
              <dt className="w-32 shrink-0 text-muted">Enrollment No.</dt>
              <dd className="tnum m-0">{row.enrollment_no}</dd>
            </div>
          ) : null}
        </dl>

        {row.registrar_remarks ? (
          <p className="m-0 mt-4 text-[13px] text-muted">
            <span className="font-semibold text-jnu-800">Registrar&rsquo;s remarks: </span>
            {row.registrar_remarks}
          </p>
        ) : null}

        <p className="m-0 mt-4 text-xs text-muted">
          This response reflects the university record at the time of the query. It
          confirms the existence and status of a record only; it does not itself
          constitute a certificate.
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
