'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

type Row = {
  id: string
  roll_no: string
  student_name: string
  programme: string
  semester: string
  exam_session: string
  status: string
  published: boolean
}

const EMPTY = {
  roll_no: '',
  student_name: '',
  programme: '',
  semester: '',
  exam_session: '',
  status: 'PASS',
}

/**
 * Results CRUD plus CSV bulk import.
 *
 * `published` is the control that matters: a row is invisible to students
 * until the exam cell flips it, and RLS enforces that server-side. Adding a
 * result and publishing it are deliberately two separate actions.
 */
export function ResultsManager() {
  const [rows, setRows] = useState<Row[]>([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  async function load() {
    const supabase = getSupabase()
    if (!supabase) return

    const { data, error } = await supabase
      .from('results')
      .select('id, roll_no, student_name, programme, semester, exam_session, status, published')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setMsg({ tone: 'err', text: 'Could not load results.' })
      return
    }
    setRows((data ?? []) as Row[])
  }

  useEffect(() => {
    load()
  }, [])

  async function addResult(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabase()
    if (!supabase) return

    setBusy(true)
    const { error } = await supabase.from('results').insert({
      ...form,
      roll_no: form.roll_no.trim().toUpperCase(),
      published: false, // never auto-publish
    })
    setBusy(false)

    if (error) {
      setMsg({
        tone: 'err',
        text: error.message.includes('duplicate')
          ? 'A result already exists for that roll number, semester and session.'
          : 'Could not save. Check the fields and try again.',
      })
      return
    }

    setMsg({ tone: 'ok', text: 'Result saved as unpublished. Publish it when ready.' })
    setForm(EMPTY)
    load()
  }

  async function togglePublish(row: Row) {
    const supabase = getSupabase()
    if (!supabase) return

    const next = !row.published
    const { error } = await supabase
      .from('results')
      .update({
        published: next,
        published_at: next ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (error) {
      setMsg({ tone: 'err', text: 'Could not change publication state.' })
      return
    }
    setMsg({
      tone: 'ok',
      text: next
        ? `${row.roll_no} is now visible to students.`
        : `${row.roll_no} is hidden from students.`,
    })
    load()
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete the result for ${row.roll_no} (${row.semester})? This is logged.`)) {
      return
    }
    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase.from('results').delete().eq('id', row.id)
    if (error) {
      setMsg({ tone: 'err', text: 'Could not delete.' })
      return
    }
    setMsg({ tone: 'ok', text: `Deleted ${row.roll_no}.` })
    load()
  }

  /**
   * CSV import. Expected header:
   *   roll_no,student_name,programme,semester,exam_session,marks_obtained,marks_max,sgpa,status
   * Rows arrive unpublished, so a bad import can be corrected before anyone sees it.
   */
  async function onCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const supabase = getSupabase()
    if (!supabase) return

    setBusy(true)
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      setBusy(false)
      setMsg({ tone: 'err', text: 'The file has no data rows.' })
      return
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const records = lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim())
      const rec: Record<string, unknown> = { published: false }

      header.forEach((key, i) => {
        const raw = cells[i] ?? ''
        if (key === 'roll_no') rec[key] = raw.toUpperCase()
        else if (['marks_obtained', 'marks_max', 'sgpa'].includes(key)) {
          rec[key] = raw === '' ? null : Number(raw)
        } else rec[key] = raw
      })
      return rec
    })

    const { error } = await supabase.from('results').insert(records)
    setBusy(false)
    e.target.value = ''

    if (error) {
      setMsg({ tone: 'err', text: `Import failed: ${error.message}` })
      return
    }
    setMsg({
      tone: 'ok',
      text: `Imported ${records.length} rows as unpublished. Review, then publish.`,
    })
    load()
  }

  const field = (
    name: keyof typeof EMPTY,
    label: string,
    placeholder?: string,
    required = true
  ) => (
    <div>
      <label htmlFor={name} className="mb-1 block text-[12px] font-semibold text-jnu-800">
        {label}
      </label>
      <input
        id={name}
        required={required}
        value={form[name]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
      />
    </div>
  )

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

      {/* ---- add one ---- */}
      <form onSubmit={addResult} className="panel">
        <h2 className="panel-head m-0">Add a Result</h2>
        <div className="panel-body">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field('roll_no', 'Roll Number', 'JNU2026BT0147')}
            {field('student_name', 'Student Name')}
            {field('programme', 'Programme', 'B.Tech Computer Science')}
            {field('semester', 'Semester', 'Semester IV')}
            {field('exam_session', 'Exam Session', 'Even 2025-26')}
            <div>
              <label htmlFor="status" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
              >
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="ATKT">ATKT</option>
                <option value="WITHHELD">WITHHELD</option>
              </select>
            </div>
          </div>
          <p className="m-0 mt-3 text-xs text-muted">
            Saved rows are unpublished. Students see nothing until you publish them.
          </p>
          <button type="submit" disabled={busy} className="btn btn-primary mt-3">
            {busy ? 'Saving…' : 'Save result'}
          </button>
        </div>
      </form>

      {/* ---- bulk import ---- */}
      <div className="panel">
        <h2 className="panel-head m-0">Bulk Import (CSV)</h2>
        <div className="panel-body">
          <p className="m-0 mb-3 text-[13px] text-muted">
            Header row must be:{' '}
            <code className="text-[12px]">
              roll_no,student_name,programme,semester,exam_session,marks_obtained,marks_max,sgpa,status
            </code>
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onCsv}
            disabled={busy}
            className="text-[13px]"
            aria-label="Choose a CSV file of results"
          />
        </div>
      </div>

      {/* ---- list ---- */}
      <div className="panel">
        <h2 className="panel-head m-0">Recent Results</h2>
        <div className="panel-body p-0">
          {rows.length === 0 ? (
            <p className="m-0 px-4 py-5 text-[13px] text-muted">No results recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Roll No.</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Name</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Semester</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Session</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Status</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Visible</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="tnum border-b border-hair px-3 py-2 font-semibold">{r.roll_no}</td>
                      <td className="border-b border-hair px-3 py-2">{r.student_name}</td>
                      <td className="border-b border-hair px-3 py-2">{r.semester}</td>
                      <td className="border-b border-hair px-3 py-2">{r.exam_session}</td>
                      <td className="border-b border-hair px-3 py-2">{r.status}</td>
                      <td className="border-b border-hair px-3 py-2">
                        <span
                          className={`rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                            r.published
                              ? 'border-[#2c6549] text-[#2c6549]'
                              : 'border-hair text-muted'
                          }`}
                        >
                          {r.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="border-b border-hair px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => togglePublish(r)}
                          className="mr-2 text-jnu-600 underline"
                        >
                          {r.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(r)}
                          className="text-[#a8322b] underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
