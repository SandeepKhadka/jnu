'use client'

import { useCallback, useEffect, useState } from 'react'

import { del, getJson, patchJson } from '@/lib/admin-client'
import {
  Button,
  Card,
  ConfirmButton,
  Field,
  Input,
  Loading,
  PageHeader,
  Pagination,
  Pill,
  Select,
  StatusLine,
  useStatus,
} from '@/components/admin/ui'

type Counselling = {
  id: string
  reference: string
  counsellorName: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  state: string
  district: string
  city: string
  photoId: string | null
  aadhaarId: string | null
  status: string
  remarks: string | null
  createdAt: string
}

const STATUSES = ['NEW', 'CONTACTED', 'CLOSED']

const TONE: Record<string, 'ok' | 'warn' | 'bad' | 'muted'> = {
  NEW: 'warn',
  CONTACTED: 'ok',
  CLOSED: 'muted',
}

/**
 * Education consultancy requests from the public site.
 *
 * Deleting is offered here and not on admissions, because a counselling lead
 * has no academic consequence and may hold an identity document belonging to
 * someone who never enrolled. Deleting the row removes the uploaded files
 * with it, which is how an erasure request is honoured.
 */
export default function CounsellingPage() {
  const [rows, setRows] = useState<Counselling[] | null>(null)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatusFilter] = useState('')
  const { status: msg, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ rows: Counselling[]; total: number; pageSize: number }>(
      `/api/counselling?q=${encodeURIComponent(q)}&status=${status}&page=${page}`
    )
    if (res.ok) {
      setRows(res.data.rows)
      setTotal(res.data.total)
      setPageSize(res.data.pageSize)
    } else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatusFor(row: Counselling, next: string) {
    const res = await patchJson(`/api/counselling/${row.id}`, { status: next, remarks: row.remarks ?? '' })
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    saved()
    await load()
  }

  async function remove(row: Counselling) {
    const res = await del(`/api/counselling/${row.id}`)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    show({ tone: 'ok', text: `Deleted ${row.reference} and any files attached to it.` })
    await load()
  }

  if (rows === null) return <Loading />

  return (
    <div>
      <PageHeader
        title="Education consultancy online"
        description="Requests submitted through the Education Consultancy Online button on the public site."
      />
      <StatusLine status={msg} />

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Field label="Search">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                placeholder="Reference, name, counsellor, mobile or email"
              />
            </Field>
          </div>
          <div className="min-w-[160px]">
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                options={[
                  { value: '', label: 'All' },
                  ...STATUSES.map((s) => ({ value: s, label: s })),
                ]}
              />
            </Field>
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p className="m-0 text-[13px] text-muted">No counselling requests match that search.</p>
        </Card>
      ) : (
        rows.map((r) => (
          <Card
            key={r.id}
            title={`${r.firstName} ${r.lastName}`}
            description={`${r.reference} · submitted ${new Date(r.createdAt).toLocaleDateString('en-IN')}`}
            actions={
              <>
                <Pill tone={TONE[r.status] ?? 'muted'}>{r.status}</Pill>
                {STATUSES.filter((s) => s !== r.status).map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => setStatusFor(r, s)}>
                    Mark {s.toLowerCase()}
                  </Button>
                ))}
                <ConfirmButton
                  question={`Delete ${r.reference}? Any photograph or Aadhaar document attached is deleted with it. This cannot be undone.`}
                  onConfirm={() => remove(r)}
                >
                  Delete
                </ConfirmButton>
              </>
            }
          >
            <dl className="m-0 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Counsellor / consultancy" value={r.counsellorName} />
              <Detail label="Email" value={r.email} />
              <Detail label="Mobile" value={r.mobile} />
              <Detail label="State" value={r.state} />
              <Detail label="District" value={r.district} />
              <Detail label="City" value={r.city} />
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.photoId ? (
                <a href={`/api/uploads/${r.photoId}`} target="_blank" rel="noopener" className="btn btn-secondary text-[11px]">
                  View photograph
                </a>
              ) : (
                <span className="text-[12px] text-muted">No photograph attached</span>
              )}
              {r.aadhaarId ? (
                <a href={`/api/uploads/${r.aadhaarId}`} target="_blank" rel="noopener" className="btn btn-secondary text-[11px]">
                  View Aadhaar document
                </a>
              ) : (
                <span className="text-[12px] text-muted">No Aadhaar document attached</span>
              )}
            </div>

            {r.remarks ? <p className="m-0 mt-3 text-[13px] text-muted">Remarks: {r.remarks}</p> : null}
          </Card>
        ))
      )}

      <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="m-0 text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="m-0 text-jnu-900">{value}</dd>
    </div>
  )
}
