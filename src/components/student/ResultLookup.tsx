'use client'

import { useState } from 'react'
import { findPublishedResults, type ResultRecord } from '@/lib/store'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; rows: ResultRecord[] }
  | { kind: 'invalid'; roll: string }

/**
 * The behaviour asked for: a roll number the exam cell has published returns
 * the marksheet; anything else returns "Invalid roll number".
 *
 * The "invalid" path is correct rather than merely convenient, because the
 * store only ever returns published rows. An unpublished result is therefore
 * indistinguishable from a non-existent one, and the message does not
 * distinguish "no such student" from "not published" — which would otherwise
 * let anyone enumerate enrolled roll numbers.
 */
export function ResultLookup() {
  const [roll, setRoll] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const value = roll.trim().toUpperCase()
    if (!value) return

    setState({ kind: 'loading' })
    const rows = await findPublishedResults(value)

    setState(rows.length > 0 ? { kind: 'found', rows } : { kind: 'invalid', roll: value })
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="panel no-print mb-6">
        <h2 className="panel-head m-0">Examination Result</h2>
        <div className="panel-body">
          <label htmlFor="roll" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
            Enter Roll Number
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="roll"
              name="roll"
              type="text"
              autoComplete="off"
              required
              maxLength={24}
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="JNU2024BT0147"
              aria-describedby="roll-help"
              className="w-full max-w-[260px] rounded border border-hair px-3 py-2 text-[14px] uppercase tracking-wide focus:border-jnu-400"
            />
            <button type="submit" className="btn btn-primary" disabled={state.kind === 'loading'}>
              {state.kind === 'loading' ? 'Checking…' : 'View Result'}
            </button>
          </div>
          <p id="roll-help" className="m-0 mt-2 text-xs text-muted">
            Results appear here only after the examination cell has published them.
            Enter the roll number exactly as printed on your admit card.
          </p>

          <p className="m-0 mt-3 rounded border border-hair bg-shell px-3 py-2 text-xs text-muted">
            <strong className="text-jnu-800">Sample roll numbers: </strong>
            <button type="button" onClick={() => setRoll('JNU2024BT0147')} className="underline">
              JNU2024BT0147
            </button>
            {' · '}
            <button type="button" onClick={() => setRoll('JNU2025MB0088')} className="underline">
              JNU2025MB0088
            </button>
            {' · '}
            <button type="button" onClick={() => setRoll('JNU2024BT0166')} className="underline">
              JNU2024BT0166
            </button>{' '}
            (ATKT)
            {' · '}
            <button type="button" onClick={() => setRoll('JNU2024BT0171')} className="underline">
              JNU2024BT0171
            </button>{' '}
            (unpublished — returns invalid)
          </p>
        </div>
      </form>

      {/* ---- announce outcomes to assistive tech ---- */}
      <div aria-live="polite">
        {state.kind === 'invalid' ? (
          <div className="panel border-l-[3px] border-l-[#a8322b] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Invalid roll number</p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              No published result was found for{' '}
              <span className="tnum font-semibold">{state.roll}</span>. Check the number and
              try again. If your result has not yet been declared, it will not appear here.
            </p>
          </div>
        ) : null}

        {state.kind === 'found'
          ? state.rows.map((r) => <Marksheet key={r.id} row={r} />)
          : null}
      </div>
    </div>
  )
}

function Marksheet({ row }: { row: ResultRecord }) {
  const subjects = Array.isArray(row.subjects) ? row.subjects : []
  const pct = row.marks_max > 0 ? (row.marks_obtained / row.marks_max) * 100 : 0

  return (
    <article className="panel mb-5">
      <h2 className="panel-head m-0 flex flex-wrap items-center justify-between gap-2">
        <span>
          {row.semester} — {row.exam_session}
        </span>
        <span
          className={`rounded-sm border px-2 py-0.5 text-[11px] uppercase tracking-wide ${
            row.status === 'PASS'
              ? 'border-[#2c6549] text-[#2c6549]'
              : row.status === 'ATKT'
                ? 'border-[#9a6a10] text-[#9a6a10]'
                : 'border-[#a8322b] text-[#a8322b]'
          }`}
        >
          {row.status}
        </span>
      </h2>

      <div className="panel-body">
        <dl className="m-0 mb-4 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <Row label="Roll Number" value={row.roll_no} mono bold />
          <Row label="Name" value={row.student_name} bold />
          <Row label="Programme" value={row.programme} />
          <Row label="SGPA" value={row.sgpa.toFixed(2)} mono />
          <Row label="Marks" value={`${row.marks_obtained} / ${row.marks_max}`} mono />
          <Row label="Percentage" value={`${pct.toFixed(2)}%`} mono />
        </dl>

        {subjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border border-hair bg-shell px-3 py-2 text-left">Code</th>
                  <th className="border border-hair bg-shell px-3 py-2 text-left">Subject</th>
                  <th className="border border-hair bg-shell px-3 py-2 text-right">Max</th>
                  <th className="border border-hair bg-shell px-3 py-2 text-right">Obtained</th>
                  <th className="border border-hair bg-shell px-3 py-2 text-left">Grade</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={`${s.code}-${i}`}>
                    <td className="tnum border border-hair px-3 py-2">{s.code}</td>
                    <td className="border border-hair px-3 py-2">{s.name}</td>
                    <td className="tnum border border-hair px-3 py-2 text-right">{s.max}</td>
                    <td
                      className={`tnum border border-hair px-3 py-2 text-right ${
                        s.obtained < s.max * 0.4 ? 'font-semibold text-[#a8322b]' : ''
                      }`}
                    >
                      {s.obtained}
                    </td>
                    <td className="border border-hair px-3 py-2">{s.grade}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="border border-hair bg-shell px-3 py-2 font-semibold">
                    Total
                  </td>
                  <td className="tnum border border-hair bg-shell px-3 py-2 text-right font-semibold">
                    {row.marks_max}
                  </td>
                  <td className="tnum border border-hair bg-shell px-3 py-2 text-right font-semibold">
                    {row.marks_obtained}
                  </td>
                  <td className="border border-hair bg-shell px-3 py-2" />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}

        {row.status === 'ATKT' ? (
          <p className="m-0 mt-4 text-[13px] text-[#9a6a10]">
            Subjects below the minimum are shown in red. You are permitted to carry these
            forward and must appear in the next available back-paper examination.
          </p>
        ) : null}

        <p className="m-0 mt-4 text-xs text-muted">
          This is a provisional statement of marks for information only. It is not a
          substitute for the official marksheet issued by the examination cell.
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
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className={`m-0 ${mono ? 'tnum' : ''} ${bold ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  )
}
