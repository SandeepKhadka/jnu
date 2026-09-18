'use client'

import { useEffect, useState } from 'react'

import { site } from '@/content/site'
import { divisionFor, dottedDate, percentageOf } from '@/lib/marksheet'
import { verifyMarksheet, type MarksheetVerifyOutcome } from '@/lib/store'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; outcome: MarksheetVerifyOutcome }

/**
 * Verifies a printed statement of marks by its serial.
 *
 * Arriving from the QR code, the serial is in ?sn= and the check runs at once;
 * otherwise the serial can be typed in from the sheet. The response shows the
 * marks on record so the person checking can compare them line by line with
 * the paper in front of them — a sheet edited before printing will differ.
 *
 * The query string is read from window.location in an effect rather than
 * through useSearchParams, so the page stays statically prerendered without a
 * Suspense boundary for what is one optional parameter.
 */
export function MarksheetVerify() {
  const [serial, setSerial] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function run(value: string) {
    if (!value.trim()) return
    setState({ kind: 'loading' })
    setState({ kind: 'done', outcome: await verifyMarksheet(value) })
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
        <h2 className="panel-head m-0">Verify a Statement of Marks</h2>
        <div className="panel-body">
          <label htmlFor="ms-sn" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
            Sr. No. (printed on the statement)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="ms-sn"
              type="text"
              autoComplete="off"
              required
              maxLength={40}
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="JNU-SOM-XXXX-XXXX-XXXX"
              className="tnum w-full max-w-[320px] rounded border border-hair px-3 py-2 text-[14px] uppercase tracking-wide focus:border-jnu-400"
            />
            <button type="submit" className="btn btn-primary" disabled={state.kind === 'loading'}>
              {state.kind === 'loading' ? 'Checking…' : 'Verify'}
            </button>
          </div>
          <p className="m-0 mt-2 text-xs text-muted">
            Scanning the QR code on the statement fills this in automatically.
          </p>
        </div>
      </form>

      <div aria-live="polite">{state.kind === 'done' ? <Outcome outcome={state.outcome} /> : null}</div>
    </div>
  )
}

function Outcome({ outcome }: { outcome: MarksheetVerifyOutcome }) {
  if (outcome.kind === 'error') {
    return (
      <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
        <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">Could not check</p>
        <p className="m-0 mt-1 text-[13px] text-muted">{outcome.error}</p>
      </div>
    )
  }

  if (outcome.kind === 'withdrawn') {
    return (
      <div className="panel border-l-[3px] border-l-[#a8322b] p-4" data-print-scope>
        <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Withdrawn</p>
        <p className="m-0 mt-1 text-[13px] text-muted">
          This serial was issued, but the result it belongs to has since been withdrawn by the
          examination cell. The statement must not be relied on. Contact{' '}
          <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a>.
        </p>
      </div>
    )
  }

  if (outcome.kind === 'not-found') {
    return (
      <div className="panel border-l-[3px] border-l-[#a8322b] p-4" data-print-scope>
        <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Not verified</p>
        <p className="m-0 mt-1 text-[13px] text-muted">
          No statement of marks with this serial was issued by the university. Check the
          serial for transcription errors. If it is correct as printed, the document was not
          produced from the university record — contact{' '}
          <a href={`mailto:${site.verificationEmail}`}>{site.verificationEmail}</a>.
        </p>
      </div>
    )
  }

  const s = outcome.sheet
  const pct = percentageOf(s.marksObtained, s.marksMax)

  return (
    <article className="panel border-l-[3px] border-l-[#2c6549]" data-print-scope>
      <h2 className="panel-head m-0 flex flex-wrap items-center justify-between gap-2">
        <span>Statement of Marks — on record</span>
        <span className="rounded-sm border border-[#2c6549] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[#2c6549]">
          Verified
        </span>
      </h2>
      <div className="panel-body">
        <p className="m-0 mb-4 text-[13px] text-muted">
          Compare every figure below with the printed statement. Any difference means the
          document has been altered.
        </p>

        <dl className="m-0 mb-4 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <Row label="Sr. No." value={s.serial} mono bold />
          <Row label="Roll Number" value={s.rollNo} mono bold />
          <Row label="Enrollment No." value={s.enrollmentNo ?? '—'} mono />
          <Row label="Candidate Name" value={s.studentName} bold />
          <Row label="Programme" value={s.programme} />
          <Row label="Semester / Session" value={`${s.semester} — ${s.examSession}`} />
          <Row label="Marks" value={`${s.marksObtained} / ${s.marksMax}`} mono />
          <Row label="Percentage" value={`${pct.toFixed(2)}%`} mono />
          <Row label="Result" value={s.status} bold />
          <Row label="Grade" value={divisionFor(s.status, pct)} />
          <Row label="Dated" value={s.publishedAt ? dottedDate(s.publishedAt) : '—'} mono />
        </dl>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="border border-hair bg-shell px-3 py-2 text-left">Code</th>
                <th className="border border-hair bg-shell px-3 py-2 text-left">Subject</th>
                <th className="border border-hair bg-shell px-3 py-2 text-right">Max</th>
                <th className="border border-hair bg-shell px-3 py-2 text-right">Theory</th>
                <th className="border border-hair bg-shell px-3 py-2 text-right">Practical</th>
                <th className="border border-hair bg-shell px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {s.subjects.map((sub, i) => (
                <tr key={`${sub.code}-${i}`}>
                  <td className="tnum border border-hair px-3 py-2">{sub.code}</td>
                  <td className="border border-hair px-3 py-2">{sub.name}</td>
                  <td className="tnum border border-hair px-3 py-2 text-right">{sub.max}</td>
                  <td className="tnum border border-hair px-3 py-2 text-right">
                    {typeof sub.theory === 'number' ? sub.theory : sub.obtained}
                  </td>
                  <td className="tnum border border-hair px-3 py-2 text-right">
                    {typeof sub.practical === 'number' ? sub.practical : '—'}
                  </td>
                  <td className="tnum border border-hair px-3 py-2 text-right font-semibold">
                    {sub.obtained}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="m-0 mt-4 text-xs text-muted">
          This response reflects the university examination record at the time of the query.
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
      <dt className="w-36 shrink-0 text-muted">{label}</dt>
      <dd className={`m-0 min-w-0 ${mono ? 'tnum' : ''} ${bold ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  )
}
