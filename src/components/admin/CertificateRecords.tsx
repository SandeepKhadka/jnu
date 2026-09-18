'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { site } from '@/content/site'
import {
  listCertificates,
  issueCertificate,
  setCertificateStatus,
  nextCertificateNo,
  getSession,
  type CertificateRecord,
} from '@/lib/store'
import { CertificateTemplate } from './CertificateTemplate'
import { StationeryOverlay } from './CertificateStationery'

const DIVISIONS = [
  'First Division with Distinction',
  'First Division',
  'Second Division',
  'Third Division',
]

const thisYear = new Date().getFullYear()

function emptyForm(rows: CertificateRecord[] = []) {
  return {
    roll_no: '',
    award_year: String(thisYear),
    division: DIVISIONS[1],
    certificate_no: nextCertificateNo(thisYear, rows),
    registrar_remarks: '',
  }
}

/**
 * Certificate register, issuing and printing.
 *
 * A degree is issued to a student on the register by ROLL NUMBER; the server
 * takes name, programme and enrollment number from that record. Issuing
 * writes the register entry first, so everything printed is verifiable — by
 * roll number and date of birth at /verify/, or by the QR on the degree.
 *
 * Genuine degrees are printed with "Print on stationery", onto the
 * university's pre-printed blanks. "Preview" renders the full design with a
 * SPECIMEN watermark, for checking wording only.
 *
 * Issuing, stationery printing and status changes are registrar-only on the
 * server; the controls are hidden for other roles so nobody is offered a
 * button that will refuse them.
 */
export function CertificateRecords() {
  const [rows, setRows] = useState<CertificateRecord[]>([])
  const [form, setForm] = useState(() => emptyForm())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [preview, setPreview] = useState<CertificateRecord | null>(null)
  const [printing, setPrinting] = useState<CertificateRecord | null>(null)
  const [isRegistrar, setIsRegistrar] = useState(false)

  const load = useCallback(async () => {
    setRows(await listCertificates())
  }, [])

  useEffect(() => {
    void load()
    void getSession().then((s) => setIsRegistrar(s?.role === 'registrar'))
  }, [load])

  // Print isolation for the specimen preview.
  useEffect(() => {
    if (preview) document.body.classList.add('cert-printing')
    else document.body.classList.remove('cert-printing')
    return () => document.body.classList.remove('cert-printing')
  }, [preview])

  // Keep the suggested number in step with the selected year.
  useEffect(() => {
    const year = Number(form.award_year)
    if (Number.isInteger(year) && year > 1949 && year <= thisYear) {
      setForm((f) => ({ ...f, certificate_no: nextCertificateNo(year, rows) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.award_year, rows.length])

  const closePrinting = useCallback(() => setPrinting(null), [])

  async function onIssue(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    const year = Number(form.award_year)
    if (!Number.isInteger(year) || year < 1950 || year > thisYear) {
      setMsg({ tone: 'err', text: `Enter a year of award between 1950 and ${thisYear}.` })
      return
    }
    if (!form.roll_no.trim()) {
      setMsg({ tone: 'err', text: 'Enter the roll number of the student receiving the degree.' })
      return
    }

    setBusy(true)
    const res = await issueCertificate({
      rollNo: form.roll_no.trim(),
      certificateNo: form.certificate_no,
      awardYear: year,
      division: form.division,
      registrarRemarks: form.registrar_remarks.trim() || undefined,
    })
    setBusy(false)

    if (!res.ok) {
      setMsg({ tone: 'err', text: res.error })
      return
    }

    await load()
    setMsg({
      tone: 'ok',
      text:
        `${res.record.certificate_no} issued to ${res.record.student_name} and entered in the ` +
        'register. Check the preview, then use "Print on stationery".',
    })
    setPreview(res.record)
    setForm(emptyForm(rows))
  }

  async function changeStatus(row: CertificateRecord, status: CertificateRecord['status']) {
    let res: { ok: true } | { ok: false; error: string }
    if (status === 'REVOKED') {
      const reason = window.prompt(
        `Revoke ${row.certificate_no}? Enter the reason — it is recorded in the audit log and shown on the verification page.`
      )
      if (reason === null) return
      res = await setCertificateStatus(row.id, status, reason)
    } else {
      res = await setCertificateStatus(row.id, status, '')
    }
    if (!res.ok) {
      setMsg({ tone: 'err', text: res.error })
      return
    }
    await load()
    setMsg({ tone: 'ok', text: `${row.certificate_no} set to ${status}.` })
  }

  return (
    <div className="space-y-6">
      {preview ? <PreviewOverlay cert={preview} onClose={() => setPreview(null)} /> : null}
      {printing ? <StationeryOverlay cert={printing} onClose={closePrinting} /> : null}

      <div className="panel border-l-[3px] border-l-sand-500">
        <div className="panel-body">
          <p className="m-0 text-[13px] text-muted">
            <strong className="text-jnu-800">How degrees are issued: </strong>
            enter the student&rsquo;s roll number — name, programme and enrollment number come
            from the student register. Issuing writes the certificate to the register, so it
            is verifiable on the <a href="/verify/">verification page</a> and by the QR code
            printed on it. Degrees are printed with{' '}
            <strong className="text-jnu-800">Print on stationery</strong> onto the
            university&rsquo;s certificate blanks and signed by hand; every print is logged.{' '}
            <strong className="text-jnu-800">Preview</strong> carries a SPECIMEN watermark and
            is for checking wording only.
          </p>
          {!isRegistrar ? (
            <p className="m-0 mt-2 text-[13px] text-[#9a6a10]">
              Issuing, printing and revoking degrees are restricted to the registrar. You can
              view the register.
            </p>
          ) : null}
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

      {/* ---- issue ---- */}
      {isRegistrar ? (
        <form onSubmit={onIssue} className="panel">
          <h2 className="panel-head m-0">Issue a Degree</h2>
          <div className="panel-body">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Text
                id="roll_no"
                label="Student Roll Number"
                value={form.roll_no}
                onChange={(v) => setForm({ ...form, roll_no: v })}
                placeholder="JNU2024BT0147"
                required
              />

              <Text
                id="award_year"
                label="Year of Award"
                value={form.award_year}
                onChange={(v) => setForm({ ...form, award_year: v })}
                required
              />

              <div>
                <label htmlFor="division" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                  Division
                </label>
                <select
                  id="division"
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                  className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="certificate_no" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                  Certificate Number
                </label>
                <input
                  id="certificate_no"
                  value={form.certificate_no}
                  onChange={(e) => setForm({ ...form, certificate_no: e.target.value })}
                  className="tnum w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
                />
                <p className="m-0 mt-1 text-[11px] text-muted">
                  Auto-sequenced from the register; edit if the paper register differs.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Text
                  id="registrar_remarks"
                  label="Remarks (optional, shown on verification)"
                  value={form.registrar_remarks}
                  onChange={(v) => setForm({ ...form, registrar_remarks: v })}
                />
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary mt-4">
              {busy ? 'Issuing…' : 'Issue degree'}
            </button>
          </div>
        </form>
      ) : null}

      {/* ---- register ---- */}
      <div className="panel">
        <h2 className="panel-head m-0 flex items-center justify-between">
          <span>Certificate Register</span>
          <span className="tnum text-[11px] font-normal text-muted">{rows.length} records</span>
        </h2>
        <div className="panel-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Certificate No.</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Name</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Roll No.</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Programme</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-right">Year</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-left">Status</th>
                  <th className="border-b border-hair bg-shell px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="border-b border-hair px-3 py-2">
                      <span className="tnum block font-semibold">{r.certificate_no}</span>
                      {r.serial ? (
                        <span className="tnum block text-[11px] text-muted">{r.serial}</span>
                      ) : null}
                    </td>
                    <td className="border-b border-hair px-3 py-2">{r.student_name}</td>
                    <td className="tnum border-b border-hair px-3 py-2">{r.roll_no ?? '—'}</td>
                    <td className="border-b border-hair px-3 py-2">{r.programme}</td>
                    <td className="tnum border-b border-hair px-3 py-2 text-right">{r.award_year}</td>
                    <td className="border-b border-hair px-3 py-2">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="whitespace-nowrap border-b border-hair px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setPreview(r)}
                        className="mr-3 text-jnu-600 underline"
                      >
                        Preview
                      </button>
                      {isRegistrar ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPrinting(r)}
                            className="mr-3 font-semibold text-jnu-800 underline"
                          >
                            Print on stationery
                          </button>
                          {r.status !== 'REVOKED' ? (
                            <button
                              type="button"
                              onClick={() => changeStatus(r, 'REVOKED')}
                              className="text-[#a8322b] underline"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => changeStatus(r, 'VERIFIED')}
                              className="text-jnu-600 underline"
                            >
                              Reinstate
                            </button>
                          )}
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: CertificateRecord['status'] }) {
  const tone =
    status === 'VERIFIED'
      ? 'border-[#2c6549] text-[#2c6549]'
      : status === 'REVOKED'
        ? 'border-[#a8322b] text-[#a8322b]'
        : 'border-[#9a6a10] text-[#9a6a10]'

  return (
    <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${tone}`}>
      {status}
    </span>
  )
}

/**
 * Rendered through a portal into document.body, not in place.
 *
 * This is required, not stylistic. The print rules isolate the certificate by
 * hiding `body.cert-printing > *:not(#cert-overlay)`. Left where it is
 * declared, the overlay sits five levels deep inside <main>, so hiding main's
 * children would hide the certificate along with everything else — which is
 * exactly why the print preview came out blank. As a direct child of <body> it
 * survives that rule.
 */
function PreviewOverlay({
  cert,
  onClose,
}: {
  cert: CertificateRecord
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // document.body does not exist during the static export's prerender.
  if (!mounted) return null

  return createPortal(
    <div
      id="cert-overlay"
      className="fixed inset-0 z-50 overflow-auto bg-jnu-900/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Certificate ${cert.certificate_no}`}
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-[13px] text-white">
            {cert.status !== 'VERIFIED' ? (
              <span className="mr-2 rounded-sm border border-white/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                {cert.status}
              </span>
            ) : null}
            <span className="tnum">{cert.certificate_no}</span>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="btn btn-primary">
              Print / Save as PDF
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>

        <CertificateTemplate cert={cert} />

        <p className="no-print mt-3 text-center text-[12px] text-jnu-100">
          Preview only. Verifiable at {site.url.replace(/^https?:\/\//, '')}/verify/certificate/
          {cert.serial ? (
            <>
              {' — serial '}
              <span className="tnum">{cert.serial}</span>
            </>
          ) : null}
          . Print the degree with <strong>Print on stationery</strong>.
        </p>
        <p className="no-print mt-1 text-center text-[11.5px] text-jnu-200">
          In the print dialog, tick <strong>Background graphics</strong> for the tinted
          paper and seal. The watermark and all text print either way.
        </p>
      </div>
    </div>,
    document.body
  )
}

function Text({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-jnu-800">
        {label}
      </label>
      <input
        id={id}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
      />
    </div>
  )
}
