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
  StatusLine,
  useStatus,
} from '@/components/admin/ui'
import { formatNoticeDate } from '@/lib/content-types'

type Enquiry = {
  id: string
  name: string
  email: string
  phone: string | null
  programme: string | null
  message: string
  handled: boolean
  createdAt: string
}

/** Messages sent through the contact form. */
export default function EnquiriesPage() {
  const [rows, setRows] = useState<Enquiry[] | null>(null)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [showHandled, setShowHandled] = useState(false)
  const { status, show } = useStatus()

  // Answered enquiries are filtered in the query, not in the browser, so the
  // page count matches what is actually shown.
  const load = useCallback(async () => {
    const res = await getJson<{ enquiries: Enquiry[]; total: number; pageSize: number }>(
      `/api/enquiries?q=${encodeURIComponent(q)}&page=${page}${showHandled ? '' : '&handled=false'}`
    )
    if (res.ok) {
      setRows(res.data.enquiries)
      setTotal(res.data.total)
      setPageSize(res.data.pageSize)
    } else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, showHandled])

  useEffect(() => {
    void load()
  }, [load])

  const visible = rows ?? []

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Sent from the contact page. Mark one as answered once you have replied by email or telephone."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setPage(1)
              setShowHandled((v) => !v)
            }}
          >
            {showHandled ? 'Hide answered' : 'Show answered'}
          </Button>
        }
      />
      <StatusLine status={status} />

      <Card>
        <Field label="Search">
          <Input
            placeholder="Name, email address or any word in the message"
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
            className="min-w-[320px]"
          />
        </Field>
      </Card>

      {rows === null ? (
        <Loading />
      ) : visible.length === 0 ? (
        <Card>
          <p className="m-0 text-[13px] text-muted">Nothing waiting.</p>
        </Card>
      ) : (
        visible.map((e) => (
          <Card key={e.id}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="m-0 text-[14px] font-semibold text-jnu-800">
                {e.name}{' '}
                {e.handled ? (
                  <Pill tone="muted">Answered</Pill>
                ) : (
                  <Pill tone="warn">Waiting</Pill>
                )}
              </p>
              <p className="tnum m-0 text-[12px] text-muted">{formatNoticeDate(e.createdAt.slice(0, 10))}</p>
            </div>
            <p className="m-0 text-[12.5px] text-muted">
              <a href={`mailto:${e.email}`} className="text-jnu-700">
                {e.email}
              </a>
              {e.phone ? ` · ${e.phone}` : ''}
              {e.programme ? ` · interested in ${e.programme}` : ''}
            </p>
            <p className="m-0 mt-2 whitespace-pre-wrap text-[13.5px]">{e.message}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant={e.handled ? 'secondary' : 'primary'}
                onClick={async () => {
                  const res = await patchJson(`/api/admin/enquiries/${e.id}`, { handled: !e.handled })
                  if (!res.ok) {
                    show({ tone: 'error', text: res.error })
                    return
                  }
                  await load()
                }}
              >
                {e.handled ? 'Mark as waiting' : 'Mark as answered'}
              </Button>
              <ConfirmButton
                question="Delete this enquiry?"
                onConfirm={async () => {
                  const res = await del(`/api/admin/enquiries/${e.id}`)
                  if (!res.ok) {
                    show({ tone: 'error', text: res.error })
                    return
                  }
                  await load()
                }}
              >
                Delete
              </ConfirmButton>
            </div>
          </Card>
        ))
      )}

      <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} unit="enquiries" />
    </div>
  )
}
