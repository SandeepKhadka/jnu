'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

type Subject = { code?: string; name: string; max?: number; obtained?: number; grade?: string }

type ResultRow = {
  roll_no: string
  student_name: string
  programme: string
  semester: string
  exam_session: string
  subjects: Subject[]
  marks_obtained: number | null
  marks_max: number | null
  sgpa: number | null
  status: string
}

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; rows: ResultRow[] }
  | { kind: 'invalid'; roll: string }
  | { kind: 'error'; message: string }
  | { kind: 'unconfigured' }

/**
 * The behaviour asked for: a roll number the exam cell has published returns
 * the marksheet; anything else returns "Invalid roll number".
 *
 * Two things make the "invalid" path correct rather than merely convenient:
 *  - RLS restricts anon SELECT to `published = true`, so an unpublished result
 *    is indistinguishable from a non-existent one. Staff cannot leak a draft.
 *  - The message never distinguishes "no such student" from "not published",
 *    which would otherwise let anyone enumerate enrolled roll numbers.
 */
export function ResultLookup() {
  const [roll, setRoll] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const value = roll.trim().toUpperCase()
    if (!value) return

    const supabase = getSupabase()
    if (!supabase) {
      setState({ kind: 'unconfigured' })
      return
    }

    setState({ kind: 'loading' })

    const { data, error } = await supabase
      .from('results')
      .select(
        'roll_no, student_name, programme, semester, exam_session, subjects, marks_obtained, marks_max, sgpa, status'
      )
      .eq('roll_no', value)
      .eq('published', true)
      .order('semester', { ascending: false })

    if (error) {
      setState({ kind: 'error', message: 'Could not reach the results service. Please try again.' })
      return
    }

    if (!data || data.length === 0) {
      setState({ kind: 'invalid', roll: value })
      return
    }

    setState({ kind: 'found', rows: data as ResultRow[] })
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
              inputMode="text"
              autoComplete="off"
              required
              maxLength={24}
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="e.g. JNU2026BT0147"
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
        </div>
      </form>

      {/* ---- announce outcomes to assistive tech ---- */}
      <div aria-live="polite">
        {state.kind === 'invalid' ? (
          <div className="panel border-l-[3px] border-l-[#a8322b] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#a8322b]">Invalid roll number</p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              No published result was found for <span className="tnum font-semibold">{state.roll}</span>.
              Check the number and try again. If your examination result has not yet been
              declared, it will not appear here.
            </p>
          </div>
        ) : null}

        {state.kind === 'error' ? (
          <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">Service unavailable</p>
            <p className="m-0 mt-1 text-[13px] text-muted">{state.message}</p>
          </div>
        ) : null}

        {state.kind === 'unconfigured' ? (
          <div className="panel border-l-[3px] border-l-[#9a6a10] p-4">
            <p className="m-0 text-[14px] font-semibold text-[#9a6a10]">Results service not configured</p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>, then run{' '}
              <code>supabase/schema.sql</code>. See the README.
            </p>
          </div>
        ) : null}

        {state.kind === 'found'
          ? state.rows.map((r) => <Marksheet key={`${r.roll_no}-${r.semester}`} row={r} />)
          : null}
      </div>
    </div>
  )
}

function Marksheet({ row }: { row: ResultRow }) {
  const subjects = Array.isArray(row.subjects) ? row.subjects : []

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
              : 'border-[#a8322b] text-[#a8322b]'
          }`}
        >
          {row.status}
        </span>
      </h2>

      <div className="panel-body">
        <dl className="m-0 mb-4 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted">Roll Number</dt>
            <dd className="tnum m-0 font-semibold">{row.roll_no}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted">Name</dt>
            <dd className="m-0 font-semibold">{row.student_name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted">Programme</dt>
            <dd className="m-0">{row.programme}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted">SGPA</dt>
            <dd className="tnum m-0">{row.sgpa ?? '—'}</dd>
          </div>
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
                  <tr key={`${s.code ?? s.name}-${i}`}>
                    <td className="tnum border border-hair px-3 py-2">{s.code ?? '—'}</td>
                    <td className="border border-hair px-3 py-2">{s.name}</td>
                    <td className="tnum border border-hair px-3 py-2 text-right">{s.max ?? '—'}</td>
                    <td className="tnum border border-hair px-3 py-2 text-right">{s.obtained ?? '—'}</td>
                    <td className="border border-hair px-3 py-2">{s.grade ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
              {row.marks_max != null ? (
                <tfoot>
                  <tr>
                    <td colSpan={2} className="border border-hair bg-shell px-3 py-2 font-semibold">
                      Total
                    </td>
                    <td className="tnum border border-hair bg-shell px-3 py-2 text-right font-semibold">
                      {row.marks_max}
                    </td>
                    <td className="tnum border border-hair bg-shell px-3 py-2 text-right font-semibold">
                      {row.marks_obtained ?? '—'}
                    </td>
                    <td className="border border-hair bg-shell px-3 py-2" />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
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
