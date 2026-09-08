'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

type Cert = {
  id: string
  certificate_no: string
  student_name: string
  programme: string
  award_year: number
  status: 'VERIFIED' | 'REVOKED' | 'WITHHELD'
  registrar_remarks: string | null
}

const EMPTY = {
  certificate_no: '',
  student_name: '',
  programme: '',
  award_year: '',
  enrollment_no: '',
  status: 'VERIFIED' as Cert['status'],
  registrar_remarks: '',
}

/**
 * Certificate RECORDS — the register that backs public verification.
 *
 * Scope note, deliberate and not an oversight: this records certificates the
 * registrar has already issued on paper, so third parties can check them. It
 * does not generate, render or issue a certificate document, and it should not
 * be extended to. A tool that mints degree certificates is precisely the
 * mechanism of the fake-degree fraud this institution was sanctioned for, and
 * building one would make this codebase the instrument of it.
 *
 * Entries should be transcribed from the registrar's authoritative issuance
 * register, in bulk, by the registrar's own staff — never created ad hoc to
 * satisfy an individual enquiry.
 */
export function CertificateRecords() {
  const [rows, setRows] = useState<Cert[]>([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  async function load() {
    const supabase = getSupabase()
    if (!supabase) return

    const { data, error } = await supabase
      .from('certificates')
      .select('id, certificate_no, student_name, programme, award_year, status, registrar_remarks')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setMsg({ tone: 'err', text: 'Could not load certificate records.' })
      return
    }
    setRows((data ?? []) as Cert[])
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabase()
    if (!supabase) return

    const year = Number(form.award_year)
    if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear()) {
      setMsg({ tone: 'err', text: 'Enter a valid year of award.' })
      return
    }

    setBusy(true)
    const { error } = await supabase.from('certificates').insert({
      certificate_no: form.certificate_no.trim().toUpperCase(),
      student_name: form.student_name.trim(),
      programme: form.programme.trim(),
      award_year: year,
      enrollment_no: form.enrollment_no.trim() || null,
      status: form.status,
      registrar_remarks: form.registrar_remarks.trim() || null,
    })
    setBusy(false)

    if (error) {
      setMsg({
        tone: 'err',
        text: error.message.includes('duplicate')
          ? 'That certificate number is already on record.'
          : 'Could not save the record.',
      })
      return
    }

    setMsg({ tone: 'ok', text: 'Record added. It is now verifiable publicly.' })
    setForm(EMPTY)
    load()
  }

  async function setStatus(row: Cert, status: Cert['status']) {
    const supabase = getSupabase()
    if (!supabase) return

    if (status === 'REVOKED') {
      const reason = window.prompt(
        `Revoke ${row.certificate_no}? Enter the reason — it is recorded in the audit log.`
      )
      if (reason === null) return

      const { error } = await supabase
        .from('certificates')
        .update({ status, registrar_remarks: reason })
        .eq('id', row.id)

      if (error) {
        setMsg({ tone: 'err', text: 'Could not update the record.' })
        return
      }
      setMsg({ tone: 'ok', text: `${row.certificate_no} marked as revoked.` })
      load()
      return
    }

    const { error } = await supabase.from('certificates').update({ status }).eq('id', row.id)
    if (error) {
      setMsg({ tone: 'err', text: 'Could not update the record.' })
      return
    }
    setMsg({ tone: 'ok', text: `${row.certificate_no} set to ${status}.` })
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
        value={form[name] as string}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="panel border-l-[3px] border-l-sand-500">
        <div className="panel-body">
          <p className="m-0 text-[13px] text-muted">
            <strong className="text-jnu-800">Scope:</strong> this register records
            certificates <em>already issued</em> by the registrar, so that employers and
            institutions can verify them on the public{' '}
            <a href="/verify/">verification page</a>. It does not produce certificate
            documents. Entries must be transcribed from the registrar&rsquo;s official
            issuance register.
          </p>
        </div>
      </div>

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

      <form onSubmit={add} className="panel">
        <h2 className="panel-head m-0">Record an Issued Certificate</h2>
        <div className="panel-body">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field('certificate_no', 'Certificate Number', 'JNU/DEG/2016/004512')}
            {field('student_name', 'Student Name')}
            {field('programme', 'Programme', 'B.Tech Civil Engineering')}
            {field('award_year', 'Year of Award', '2016')}
            {field('enrollment_no', 'Enrollment Number', 'optional', false)}
            <div>
              <label htmlFor="cert-status" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                Status
              </label>
              <select
                id="cert-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Cert['status'] })}
                className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
              >
                <option value="VERIFIED">VERIFIED</option>
                <option value="WITHHELD">WITHHELD</option>
                <option value="REVOKED">REVOKED</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="remarks" className="mb-1 block text-[12px] font-semibold text-jnu-800">
              Registrar&rsquo;s Remarks
            </label>
            <textarea
              id="remarks"
              rows={2}
              value={form.registrar_remarks}
              onChange={(e) => setForm({ ...form, registrar_remarks: e.target.value })}
              className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
            />
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary mt-3">
            {busy ? 'Saving…' : 'Add record'}
          </button>
        </div>
      </form>

      <div className="panel">
        <h2 className="panel-head m-0">Certificate Register</h2>
        <div className="panel-body p-0">
          {rows.length === 0 ? (
            <p className="m-0 px-4 py-5 text-[13px] text-muted">No certificate records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Certificate No.</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Name</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Programme</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-right">Year</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Status</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="tnum border-b border-hair px-3 py-2 font-semibold">
                        {r.certificate_no}
                      </td>
                      <td className="border-b border-hair px-3 py-2">{r.student_name}</td>
                      <td className="border-b border-hair px-3 py-2">{r.programme}</td>
                      <td className="tnum border-b border-hair px-3 py-2 text-right">{r.award_year}</td>
                      <td className="border-b border-hair px-3 py-2">
                        <span
                          className={`rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                            r.status === 'VERIFIED'
                              ? 'border-[#2c6549] text-[#2c6549]'
                              : r.status === 'REVOKED'
                                ? 'border-[#a8322b] text-[#a8322b]'
                                : 'border-[#9a6a10] text-[#9a6a10]'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="border-b border-hair px-3 py-2 text-right">
                        {r.status !== 'REVOKED' ? (
                          <button
                            type="button"
                            onClick={() => setStatus(r, 'REVOKED')}
                            className="mr-2 text-[#a8322b] underline"
                          >
                            Revoke
                          </button>
                        ) : null}
                        {r.status !== 'VERIFIED' ? (
                          <button
                            type="button"
                            onClick={() => setStatus(r, 'VERIFIED')}
                            className="text-jnu-600 underline"
                          >
                            Reinstate
                          </button>
                        ) : null}
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
