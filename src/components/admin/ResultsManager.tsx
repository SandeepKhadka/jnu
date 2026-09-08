'use client'

import { useEffect, useState } from 'react'
import { allProgrammes } from '@/content/programmes'
import {
  listResults,
  addResult,
  setResultPublished,
  deleteResult,
  importResults,
  type ResultRecord,
} from '@/lib/store'
import type { Subject } from '@/content/seed'

const SEMESTERS = [
  'Semester I', 'Semester II', 'Semester III', 'Semester IV',
  'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII',
]

function emptyForm() {
  return {
    roll_no: '',
    student_name: '',
    programme: allProgrammes[0]?.name ?? '',
    semester: 'Semester IV',
    exam_session: 'Even 2025-26',
    status: 'PASS' as ResultRecord['status'],
    marks_obtained: '',
    marks_max: '',
    sgpa: '',
  }
}

/**
 * Results CRUD plus CSV bulk import.
 *
 * `published` is the control that matters: a row is invisible to students
 * until the exam cell flips it, and adding a result and publishing it are
 * deliberately two separate actions so a bad import can be corrected first.
 */
export function ResultsManager() {
  const [rows, setRows] = useState<ResultRecord[]>([])
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  async function load() {
    setRows(await listResults())
  }

  useEffect(() => {
    load()
  }, [])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (!form.roll_no.trim() || !form.student_name.trim()) {
      setMsg({ tone: 'err', text: 'Roll number and student name are required.' })
      return
    }

    setBusy(true)
    const res = await addResult({
      roll_no: form.roll_no,
      student_name: form.student_name.trim(),
      programme: form.programme,
      semester: form.semester,
      exam_session: form.exam_session,
      subjects: [] as Subject[],
      marks_obtained: Number(form.marks_obtained) || 0,
      marks_max: Number(form.marks_max) || 0,
      sgpa: Number(form.sgpa) || 0,
      status: form.status,
    })
    setBusy(false)

    if (!res.ok) {
      setMsg({ tone: 'err', text: res.error })
      return
    }

    setMsg({ tone: 'ok', text: 'Result saved as a draft. Publish it when ready.' })
    setForm(emptyForm())
    load()
  }

  async function togglePublish(row: ResultRecord) {
    await setResultPublished(row.id, !row.published)
    setMsg({
      tone: 'ok',
      text: row.published
        ? `${row.roll_no} is now hidden from students.`
        : `${row.roll_no} is now visible on the results page.`,
    })
    load()
  }

  async function remove(row: ResultRecord) {
    if (!window.confirm(`Delete the result for ${row.roll_no} (${row.semester})? This is logged.`)) {
      return
    }
    await deleteResult(row.id)
    setMsg({ tone: 'ok', text: `Deleted ${row.roll_no}.` })
    load()
  }

  async function publishAllDrafts() {
    const drafts = rows.filter((r) => !r.published)
    if (drafts.length === 0) return
    if (!window.confirm(`Publish ${drafts.length} draft result(s) to the public results page?`)) {
      return
    }
    for (const d of drafts) await setResultPublished(d.id, true)
    setMsg({ tone: 'ok', text: `Published ${drafts.length} result(s).` })
    load()
  }

  /**
   * CSV import. Expected header:
   *   roll_no,student_name,programme,semester,exam_session,marks_obtained,marks_max,sgpa,status
   */
  async function onCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setBusy(true)
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      setBusy(false)
      e.target.value = ''
      setMsg({ tone: 'err', text: 'That file has a header but no data rows.' })
      return
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const required = ['roll_no', 'student_name', 'semester', 'exam_session']
    const missing = required.filter((r) => !header.includes(r))

    if (missing.length > 0) {
      setBusy(false)
      e.target.value = ''
      setMsg({ tone: 'err', text: `The CSV is missing required column(s): ${missing.join(', ')}.` })
      return
    }

    const records = lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim())
      const get = (k: string) => cells[header.indexOf(k)] ?? ''
      const num = (k: string) => Number(get(k)) || 0

      return {
        roll_no: get('roll_no'),
        student_name: get('student_name'),
        programme: get('programme') || form.programme,
        semester: get('semester'),
        exam_session: get('exam_session'),
        subjects: [] as Subject[],
        marks_obtained: num('marks_obtained'),
        marks_max: num('marks_max'),
        sgpa: num('sgpa'),
        status: ((get('status') || 'PASS').toUpperCase() as ResultRecord['status']),
      }
    })

    const n = await importResults(records)
    setBusy(false)
    e.target.value = ''
    setMsg({ tone: 'ok', text: `Imported ${n} row(s) as drafts. Review, then publish.` })
    load()
  }

  function downloadTemplate() {
    const csv = [
      'roll_no,student_name,programme,semester,exam_session,marks_obtained,marks_max,sgpa,status',
      'JNU2024BT0190,Example Student,B.Tech Computer Science & Engineering,Semester IV,Even 2025-26,412,550,7.88,PASS',
    ].join('\n')

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'results-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const visible = rows.filter((r) => {
    const q = filter.trim().toLowerCase()
    if (!q) return true
    return (
      r.roll_no.toLowerCase().includes(q) ||
      r.student_name.toLowerCase().includes(q) ||
      r.programme.toLowerCase().includes(q)
    )
  })

  const drafts = rows.filter((r) => !r.published).length

  return (
    <div className="space-y-6">
      {msg ? (
        <p
          role="status"
          className={`m-0 rounded border px-3 py-2 text-[13px] ${
            msg.tone === 'ok'
              ? 'border-[#2c6549]/40 bg-[#2c6549]/5 text-[#2c6549]'
              : 'border-[#a8322b]/40 bg-[#a8322b]/5 text-[#a8322b]'
          }`}
        >
          {msg.text}
        </p>
      ) : null}

      {/* ---- add ---- */}
      <form onSubmit={onAdd} className="panel">
        <h2 className="panel-head m-0">Add a Result</h2>
        <div className="panel-body">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Text id="roll_no" label="Roll Number" value={form.roll_no} onChange={(v) => setForm({ ...form, roll_no: v })} placeholder="JNU2024BT0190" />
            <Text id="student_name" label="Student Name" value={form.student_name} onChange={(v) => setForm({ ...form, student_name: v })} />

            <Select id="programme" label="Programme" value={form.programme} onChange={(v) => setForm({ ...form, programme: v })} options={allProgrammes.map((p) => p.name)} />
            <Select id="semester" label="Semester" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} options={SEMESTERS} />

            <Text id="exam_session" label="Exam Session" value={form.exam_session} onChange={(v) => setForm({ ...form, exam_session: v })} placeholder="Even 2025-26" />
            <Select id="status" label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v as ResultRecord['status'] })} options={['PASS', 'FAIL', 'ATKT', 'WITHHELD']} />

            <Text id="marks_obtained" label="Marks Obtained" value={form.marks_obtained} onChange={(v) => setForm({ ...form, marks_obtained: v })} placeholder="412" />
            <Text id="marks_max" label="Maximum Marks" value={form.marks_max} onChange={(v) => setForm({ ...form, marks_max: v })} placeholder="550" />
            <Text id="sgpa" label="SGPA" value={form.sgpa} onChange={(v) => setForm({ ...form, sgpa: v })} placeholder="7.88" />
          </div>

          <p className="m-0 mt-3 text-xs text-muted">
            Saved as a draft. Students see nothing until you publish it.
          </p>
          <button type="submit" disabled={busy} className="btn btn-primary mt-3">
            {busy ? 'Saving…' : 'Save as draft'}
          </button>
        </div>
      </form>

      {/* ---- import ---- */}
      <div className="panel">
        <h2 className="panel-head m-0">Bulk Import (CSV)</h2>
        <div className="panel-body">
          <p className="m-0 mb-3 text-[13px] text-muted">
            Required columns: <code className="text-[12px]">roll_no</code>,{' '}
            <code className="text-[12px]">student_name</code>,{' '}
            <code className="text-[12px]">semester</code>,{' '}
            <code className="text-[12px]">exam_session</code>. Optional:{' '}
            <code className="text-[12px]">programme</code>,{' '}
            <code className="text-[12px]">marks_obtained</code>,{' '}
            <code className="text-[12px]">marks_max</code>,{' '}
            <code className="text-[12px]">sgpa</code>,{' '}
            <code className="text-[12px]">status</code>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onCsv}
              disabled={busy}
              className="text-[13px]"
              aria-label="Choose a CSV file of results"
            />
            <button type="button" onClick={downloadTemplate} className="btn btn-secondary">
              Download template
            </button>
          </div>
        </div>
      </div>

      {/* ---- list ---- */}
      <div className="panel">
        <h2 className="panel-head m-0 flex flex-wrap items-center justify-between gap-2">
          <span>Results</span>
          <span className="tnum text-[11px] font-normal text-muted">
            {rows.length} total · {drafts} draft
          </span>
        </h2>
        <div className="panel-body">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by roll number, name or programme"
              aria-label="Filter results"
              className="w-full max-w-[320px] rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
            />
            {drafts > 0 ? (
              <button type="button" onClick={publishAllDrafts} className="btn btn-secondary">
                Publish all {drafts} drafts
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Roll No.</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Name</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Semester</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Session</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-right">SGPA</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Status</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Visible</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted">
                      No results match that filter.
                    </td>
                  </tr>
                ) : (
                  visible.map((r) => (
                    <tr key={r.id}>
                      <td className="tnum border-b border-hair px-3 py-2 font-semibold">{r.roll_no}</td>
                      <td className="border-b border-hair px-3 py-2">{r.student_name}</td>
                      <td className="whitespace-nowrap border-b border-hair px-3 py-2">{r.semester}</td>
                      <td className="whitespace-nowrap border-b border-hair px-3 py-2">{r.exam_session}</td>
                      <td className="tnum border-b border-hair px-3 py-2 text-right">{r.sgpa.toFixed(2)}</td>
                      <td className="border-b border-hair px-3 py-2">{r.status}</td>
                      <td className="border-b border-hair px-3 py-2">
                        <span
                          className={`rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                            r.published ? 'border-[#2c6549] text-[#2c6549]' : 'border-hair text-muted'
                          }`}
                        >
                          {r.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-hair px-3 py-2 text-right">
                        <button type="button" onClick={() => togglePublish(r)} className="mr-3 text-jnu-600 underline">
                          {r.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button type="button" onClick={() => remove(r)} className="text-[#a8322b] underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Text({
  id, label, value, onChange, placeholder,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-jnu-800">{label}</label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
      />
    </div>
  )
}

function Select({
  id, label, value, onChange, options,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-jnu-800">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
