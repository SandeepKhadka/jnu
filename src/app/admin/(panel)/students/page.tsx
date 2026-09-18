'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { getJson, postJson } from '@/lib/admin-client'
import {
  Button,
  Card,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Pill,
  Row,
  Select,
  StatusLine,
  Table,
  Td,
  Textarea,
  useStatus,
} from '@/components/admin/ui'
import { STUDENT_STATUSES } from '@/lib/student-constants'
import { StudentModal } from '@/components/admin/StudentModal'

type StudentRow = {
  id: string
  rollNo: string
  enrollmentNo: string
  fullName: string
  programme: string
  status: string
  dob: string
  lockedUntil: string | null
  hasPendingPhoto: boolean
  results: number
  certificates: number
}

/** The student register: search, add, import. */
export default function StudentsPage() {
  const [rows, setRows] = useState<StudentRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const { status, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ students: StudentRow[]; total: number }>(
      `/api/admin/students?q=${encodeURIComponent(q)}&status=${statusFilter}&page=${page}`
    )
    if (res.ok) {
      setRows(res.data.students)
      setTotal(res.data.total)
    } else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <PageHeader
        title="Students"
        description="The register behind student sign-in, results and certificate verification. A student signs in with their roll number and date of birth, so both must be exactly right."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImporting(true)}>
              Import CSV
            </Button>
            <Button onClick={() => setAdding(true)}>Add student</Button>
          </>
        }
      />
      <StatusLine status={status} />

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <Field label="Search">
            <Input
              placeholder="Roll number, enrollment number or name"
              value={q}
              onChange={(e) => {
                setPage(1)
                setQ(e.target.value)
              }}
              className="min-w-[280px]"
            />
          </Field>
          <Field label="Status">
            <Select
              value={statusFilter}
              options={[{ value: '', label: 'All' }, ...STUDENT_STATUSES.map((s) => ({ value: s, label: s }))]}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
            />
          </Field>
          <span className="pb-2 text-[12px] text-muted">{total} student(s)</span>
        </div>

        {rows === null ? (
          <Loading />
        ) : rows.length === 0 ? (
          <p className="m-0 text-[13px] text-muted">No students match.</p>
        ) : (
          <Table head={['Roll no.', 'Name', 'Programme', 'Date of birth', 'Results', 'Degrees', 'Status', '']}>
            {rows.map((s) => (
              <tr key={s.id}>
                <Td className="tnum whitespace-nowrap font-semibold">{s.rollNo}</Td>
                <Td>
                  <Link href={`/admin/students/${s.id}`} className="text-jnu-700">
                    {s.fullName}
                  </Link>
                  <span className="block text-[11px] text-muted">{s.enrollmentNo}</span>
                </Td>
                <Td className="text-[12px]">{s.programme}</Td>
                <Td className="tnum whitespace-nowrap">{s.dob}</Td>
                <Td className="tnum">{s.results}</Td>
                <Td className="tnum">{s.certificates}</Td>
                <Td className="whitespace-nowrap">
                  {s.status === 'ACTIVE' ? <Pill tone="ok">Active</Pill> : s.status === 'GRADUATED' ? <Pill tone="muted">Graduated</Pill> : <Pill tone="bad">Withdrawn</Pill>}
                  {s.lockedUntil && new Date(s.lockedUntil) > new Date() ? (
                    <span className="ml-1">
                      <Pill tone="warn">Locked</Pill>
                    </span>
                  ) : null}
                  {s.hasPendingPhoto ? (
                    <span className="ml-1">
                      <Pill tone="warn">Photo</Pill>
                    </span>
                  ) : null}
                </Td>
                <Td className="text-right">
                  <Link href={`/admin/students/${s.id}`} className="text-[12px] text-jnu-700 underline">
                    Open
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        {total > 25 ? (
          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="text-[12px] text-muted">
              Page {page} of {Math.ceil(total / 25)}
            </span>
            <Button variant="secondary" size="sm" disabled={page >= Math.ceil(total / 25)} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        ) : null}
      </Card>

      {adding ? (
        <StudentModal
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false)
            saved()
            await load()
          }}
          onError={(t) => show({ tone: 'error', text: t })}
        />
      ) : null}

      {importing ? (
        <ImportModal
          onClose={() => setImporting(false)}
          onDone={async (msg) => {
            setImporting(false)
            show({ tone: 'ok', text: msg }, 10000)
            await load()
          }}
          onError={(t) => show({ tone: 'error', text: t })}
        />
      ) : null}
    </div>
  )
}

function ImportModal({
  onClose,
  onDone,
  onError,
}: {
  onClose: () => void
  onDone: (msg: string) => void
  onError: (t: string) => void
}) {
  const [csv, setCsv] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function run() {
    setBusy(true)
    setErrors([])
    const res = await postJson<{ created: number; updated: number; errors: string[] }>('/api/admin/students', { csv })
    setBusy(false)
    if (!res.ok) {
      onError(res.error)
      return
    }
    if (res.data.errors.length) {
      setErrors(res.data.errors)
      return
    }
    onDone(`Imported ${res.data.created} new and updated ${res.data.updated} existing students.`)
  }

  return (
    <Modal title="Import students from CSV" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="m-0 text-[13px] text-muted">
          Paste the file contents below. The first row must name the columns. Required:{' '}
          <code className="text-[12px]">rollNo, enrollmentNo, fullName, fatherName, motherName, dob, programme</code>.
          Optional: status, mobile, email, addressLine, district, state, pincode. Dates must be YYYY-MM-DD. A row
          whose roll number already exists updates that student.
        </p>
        <Textarea
          rows={12}
          className="font-mono text-[12px]"
          placeholder={'rollNo,enrollmentNo,fullName,fatherName,motherName,dob,programme\nJNU2024BT0147,JNU/2024/BT/1147,Rajesh Meena,Shyam Meena,Kamla Devi,2005-04-12,B.Tech Computer Science'}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        {errors.length ? (
          <div className="rounded border border-[#a8322b]/40 bg-[#a8322b]/5 p-3 text-[12px] text-[#a8322b]">
            <p className="m-0 font-semibold">These rows were skipped; the rest were imported:</p>
            <ul className="m-0 mt-1 list-disc pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <Button onClick={run} disabled={busy || !csv.trim()}>
          {busy ? 'Importing…' : 'Import'}
        </Button>
      </div>
    </Modal>
  )
}
