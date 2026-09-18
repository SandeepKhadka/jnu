'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  getStudentPortal,
  studentSignIn,
  studentSignOut,
  type CorrectionRequest,
  type ResultRecord,
  type StudentProfile,
} from '@/lib/store'
import { formatNoticeDate } from '@/lib/content-types'
import {
  announceStudentSessionChanged,
  onStudentSessionChanged,
} from '@/lib/student-session-events'
import { ProfilePanel } from './ProfilePanel'
import { MarksheetOverlay } from './MarksheetOverlay'

/**
 * Student portal: sign in with roll number + date of birth, then see your own
 * profile and published results.
 *
 * One auth flow serves both. The alternative — a login page plus a separate
 * public roll-number lookup — would mean two doors into the same personal
 * data, one of them unauthenticated, so the login would secure nothing.
 *
 * Everything rendered here comes from /api/student/me, which reads the student
 * id from the session cookie. No roll number is sent, so there is no parameter
 * to tamper with to reach another student's record.
 */
export function StudentPortal() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [results, setResults] = useState<ResultRecord[]>([])
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([])
  const [checking, setChecking] = useState(true)
  /** The result whose printable statement is open, if any. */
  const [sheet, setSheet] = useState<ResultRecord | null>(null)
  const closeSheet = useCallback(() => setSheet(null), [])

  const refresh = useCallback(async () => {
    const data = await getStudentPortal()
    setProfile(data.student)
    setResults(data.results)
    setCorrections(data.corrections)
    setChecking(false)
  }, [])

  useEffect(() => {
    void refresh()
    // Signing out from the masthead menu must clear this screen too.
    return onStudentSessionChanged(() => void refresh())
  }, [refresh])

  /** Sign-in: reload the record, and tell the masthead menu. */
  const onSignedIn = useCallback(async () => {
    await refresh()
    announceStudentSessionChanged()
  }, [refresh])

  // While the session check is in flight, show the sign-in form rather than a
  // spinner. On a login page the overwhelmingly common state is signed out, so
  // a "Loading…" flash on every visit costs every visitor to save the few who
  // arrive with a live session — and those few see the form for one round trip
  // instead, which is the cheaper mistake.
  if (!profile) {
    return <SignInForm onSignedIn={onSignedIn} busyCheck={checking} />
  }

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[14px]">
          Signed in as <span className="font-semibold">{profile.fullName}</span>{' '}
          <span className="tnum text-muted">({profile.rollNo})</span>
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            await studentSignOut()
            await refresh()
            announceStudentSessionChanged()
          }}
        >
          Sign out
        </button>
      </div>

      <ProfilePanel profile={profile} corrections={corrections} onChanged={refresh} />

      <h2 className="rule-heading mt-8">Examination Results</h2>
      {results.length === 0 ? (
        <p className="text-[14px] text-muted">
          No results have been published against your roll number yet. Results appear here
          once the examination cell declares them.
        </p>
      ) : (
        results.map((r) => (
          <Marksheet key={r.id} row={r} profile={profile} onDownload={() => setSheet(r)} />
        ))
      )}

      {sheet ? <MarksheetOverlay row={sheet} profile={profile} onClose={closeSheet} /> : null}
    </div>
  )
}

/* ------------------------------------------------------------- sign in --- */

function SignInForm({
  onSignedIn,
  busyCheck = false,
}: {
  onSignedIn: () => Promise<void>
  busyCheck?: boolean
}) {
  const [rollNo, setRollNo] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rollNo.trim() || !dob) return

    setBusy(true)
    setError(null)

    const res = await studentSignIn(rollNo, dob)
    if (!res.ok) {
      setError(res.error)
      setBusy(false)
      return
    }
    await onSignedIn()
  }

  return (
    <form onSubmit={onSubmit} className="panel max-w-[460px]">
      <h2 className="panel-head m-0">Student Login</h2>
      <div className="panel-body">
        <div className="mb-4">
          <label htmlFor="s-roll" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
            Roll Number
          </label>
          <input
            id="s-roll"
            type="text"
            autoComplete="username"
            required
            maxLength={24}
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="JNU2024BT0147"
            className="w-full rounded border border-hair px-3 py-2 text-[14px] uppercase tracking-wide focus:border-jnu-400"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="s-dob" className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
            Date of Birth
          </label>
          <input
            id="s-dob"
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="tnum w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
          />
          <p className="m-0 mt-1.5 text-xs text-muted">
            As recorded on your admit card. Contact the examination cell if it is wrong.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="m-0 mb-4 rounded border border-[#a8322b] bg-[#fdf4f3] px-3 py-2 text-[13px] text-[#a8322b]"
          >
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={busy || busyCheck}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="m-0 mt-4 text-xs text-muted">
          After five failed attempts the account is locked for fifteen minutes.
        </p>
      </div>
    </form>
  )
}

/* ----------------------------------------------------------- marksheet --- */

function Marksheet({
  row,
  profile,
  onDownload,
}: {
  row: ResultRecord
  profile: StudentProfile
  onDownload: () => void
}) {
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
        {/* The marksheet repeats the identifying details so a printed copy
            stands on its own — a page printed from here should be readable
            without the screen above it. */}
        <dl className="m-0 mb-4 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <Row label="Roll Number" value={row.roll_no} mono bold />
          <Row label="Enrollment No." value={profile.enrollmentNo} mono bold />
          <Row label="Candidate Name" value={row.student_name} bold />
          <Row label="Father's Name" value={profile.fatherName} />
          <Row label="Mother's Name" value={profile.motherName} />
          <Row label="Date of Birth" value={formatNoticeDate(profile.dob)} mono />
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

        <p className="no-print m-0 mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onDownload} className="btn btn-primary">
            Download marksheet
          </button>
          {row.serial ? (
            <span className="tnum text-[12px] text-muted">Sr. No. {row.serial}</span>
          ) : null}
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
      <dd className={`m-0 min-w-0 ${mono ? 'tnum' : ''} ${bold ? 'font-semibold' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
