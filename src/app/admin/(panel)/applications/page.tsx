'use client'

import { useCallback, useEffect, useState } from 'react'

import { getJson, patchJson, postJson } from '@/lib/admin-client'
import {
  Button,
  Card,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Pagination,
  Pill,
  Row,
  Select,
  StatusLine,
  Table,
  Td,
  Textarea,
  useStatus,
} from '@/components/admin/ui'
import { formatNoticeDate } from '@/lib/content-types'

type AppRow = {
  id: string
  applicationNo: string
  fullName: string
  programme: string
  mobile: string
  email: string
  status: string
  createdAt: string
}

type AppDetail = AppRow & {
  fatherName: string
  motherName: string
  dob: string
  state: string
  district: string
  address: string
  pincode: string
  qualification: string
  qualificationBoard: string | null
  qualificationYear: number | null
  qualificationPct: number | null
  aadhaarLast4: string | null
  remarks: string | null
  photoUrl: string | null
  aadhaarUrl: string | null
  qualificationUrl: string | null
  enrolled: boolean
}

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED']

/** Admission applications submitted from the website. */
export default function ApplicationsPage() {
  const [rows, setRows] = useState<AppRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const { status, show } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ applications: AppRow[]; total: number; pageSize: number }>(
      `/api/applications?q=${encodeURIComponent(q)}&status=${statusFilter}&page=${page}`
    )
    if (res.ok) {
      setRows(res.data.applications)
      setTotal(res.data.total)
      setPageSize(res.data.pageSize)
    } else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <PageHeader title="Applications" description="Submitted through the admission page. Documents open only for staff." />
      <StatusLine status={status} />

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <Field label="Search">
            <Input
              placeholder="Application number, name, mobile or email"
              value={q}
              onChange={(e) => {
                setPage(1)
                setQ(e.target.value)
              }}
              className="min-w-[300px]"
            />
          </Field>
          <Field label="Stage">
            <Select
              value={statusFilter}
              options={[
                { value: '', label: 'All' },
                ...STATUSES.map((v) => ({ value: v, label: v.replace(/_/g, ' ').toLowerCase() })),
              ]}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
            />
          </Field>
        </div>

        {rows === null ? (
          <Loading />
        ) : rows.length === 0 ? (
          <p className="m-0 text-[13px] text-muted">
            {q || statusFilter ? 'No applications match.' : 'No applications yet.'}
          </p>
        ) : (
          <Table head={['Application no.', 'Applicant', 'Programme', 'Contact', 'Received', 'Status', '']}>
            {rows.map((a) => (
              <tr key={a.id}>
                <Td className="tnum whitespace-nowrap">{a.applicationNo}</Td>
                <Td className="font-semibold">{a.fullName}</Td>
                <Td className="text-[12px]">{a.programme}</Td>
                <Td className="text-[12px]">
                  {a.mobile}
                  <span className="block text-muted">{a.email}</span>
                </Td>
                <Td className="tnum whitespace-nowrap text-[12px]">{formatNoticeDate(a.createdAt.slice(0, 10))}</Td>
                <Td>
                  {a.status === 'ACCEPTED' ? (
                    <Pill tone="ok">Accepted</Pill>
                  ) : a.status === 'REJECTED' ? (
                    <Pill tone="bad">Rejected</Pill>
                  ) : a.status === 'UNDER_REVIEW' ? (
                    <Pill tone="warn">Under review</Pill>
                  ) : (
                    <Pill tone="muted">New</Pill>
                  )}
                </Td>
                <Td className="text-right">
                  <button type="button" className="text-[12px] text-jnu-700 underline" onClick={() => setOpenId(a.id)}>
                    Open
                  </button>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} unit="applications" />
      </Card>

      {openId ? (
        <ApplicationModal
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={async (msg) => {
            show({ tone: 'ok', text: msg })
            await load()
          }}
          onError={(t) => show({ tone: 'error', text: t })}
        />
      ) : null}
    </div>
  )
}

function ApplicationModal({
  id,
  onClose,
  onChanged,
  onError,
}: {
  id: string
  onClose: () => void
  onChanged: (msg: string) => void
  onError: (t: string) => void
}) {
  const [a, setA] = useState<AppDetail | null>(null)
  const [statusValue, setStatusValue] = useState('')
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [rollNo, setRollNo] = useState('')
  const [enrollmentNo, setEnrollmentNo] = useState('')

  const load = useCallback(async () => {
    const res = await getJson<{ application: AppDetail }>(`/api/admin/applications/${id}`)
    if (res.ok) {
      setA(res.data.application)
      setStatusValue(res.data.application.status)
      setRemarks(res.data.application.remarks ?? '')
    } else onError(res.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (!a) return null

  return (
    <Modal title={`${a.applicationNo} — ${a.fullName}`} onClose={onClose} wide>
      <div className="space-y-4">
        <Row cols={3}>
          <Detail label="Programme applied for" value={a.programme} />
          <Detail label="Date of birth" value={a.dob} />
          <Detail label="Father's name" value={a.fatherName} />
          <Detail label="Mother's name" value={a.motherName} />
          <Detail label="Mobile" value={a.mobile} />
          <Detail label="Email" value={a.email} />
          <Detail label="Address" value={`${a.address}, ${a.district}, ${a.state} ${a.pincode}`} />
          <Detail
            label="Qualification"
            value={[a.qualification, a.qualificationBoard, a.qualificationYear, a.qualificationPct ? `${a.qualificationPct}%` : null]
              .filter(Boolean)
              .join(' · ')}
          />
          <Detail label="Aadhaar (last 4)" value={a.aadhaarLast4 ?? '—'} />
        </Row>

        <div className="flex flex-wrap gap-3">
          {a.photoUrl ? (
            <a href={a.photoUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.photoUrl} alt="" className="h-28 w-24 rounded border border-hair object-cover" />
            </a>
          ) : null}
          {a.aadhaarUrl ? (
            <a href={a.aadhaarUrl} target="_blank" rel="noreferrer" className="text-[13px] text-jnu-700 underline">
              Aadhaar document ↗
            </a>
          ) : null}
          {a.qualificationUrl ? (
            <a href={a.qualificationUrl} target="_blank" rel="noreferrer" className="text-[13px] text-jnu-700 underline">
              Qualification document ↗
            </a>
          ) : null}
        </div>

        <div className="rounded border border-hair p-3">
          <Row>
            <Field label="Status">
              <Select
                value={statusValue}
                options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
                onChange={(e) => setStatusValue(e.target.value)}
              />
            </Field>
            <Field label="Remarks" hint="Required when rejecting.">
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Field>
          </Row>
          <Button
            className="mt-3"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const res = await patchJson(`/api/admin/applications/${id}`, { status: statusValue, remarks })
              setBusy(false)
              if (!res.ok) {
                onError(res.error)
                return
              }
              await load()
              onChanged(`${a.applicationNo} set to ${statusValue.toLowerCase().replace('_', ' ')}.`)
            }}
          >
            {busy ? 'Saving…' : 'Save status'}
          </Button>
        </div>

        {a.status === 'ACCEPTED' ? (
          <div className="rounded border border-sand-500 p-3">
            <p className="m-0 mb-2 text-[13px] font-semibold text-jnu-800">Enrol as a student</p>
            <p className="m-0 mb-3 text-[12px] text-muted">
              Creates the student record from this application — name, parents, date of birth, contact details and
              photograph are carried across, so the date of birth they gave stays exactly as it is for sign-in.
            </p>
            {enrolling ? (
              <>
                <Row>
                  <Field label="Roll number" required>
                    <Input value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
                  </Field>
                  <Field label="Enrollment number" required>
                    <Input value={enrollmentNo} onChange={(e) => setEnrollmentNo(e.target.value)} />
                  </Field>
                </Row>
                <Button
                  className="mt-3"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    const res = await postJson(`/api/admin/applications/${id}/enroll`, { rollNo, enrollmentNo })
                    setBusy(false)
                    if (!res.ok) {
                      onError(res.error)
                      return
                    }
                    setEnrolling(false)
                    onChanged(`${a.fullName} enrolled as ${rollNo}.`)
                  }}
                >
                  {busy ? 'Enrolling…' : 'Create student record'}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setEnrolling(true)}>
                Enrol this applicant
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <span className="block text-[13px]">{value}</span>
    </div>
  )
}
