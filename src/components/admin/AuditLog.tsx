'use client'

import { useCallback, useEffect, useState } from 'react'

import { getJson } from '@/lib/admin-client'
import { Card, Field, Input, Loading, Pagination, Table, Td } from '@/components/admin/ui'

type Entry = { id: string; at: string; actorEmail: string; action: string; detail: string }

/**
 * Append-only trail of every change, read from the database.
 *
 * Results and certificate records are exactly the data most worth tampering
 * with, and "who changed this, and when" is the first question anyone asks
 * afterwards. Entries are written server-side by the API routes, so they
 * cannot be edited or cleared from the browser — there is deliberately no
 * delete control on this screen.
 */
export function AuditLog() {
  const [rows, setRows] = useState<Entry[] | null>(null)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const res = await getJson<{ entries: Entry[]; total: number; pageSize: number }>(
      `/api/audit?q=${encodeURIComponent(q)}&page=${page}`
    )
    if (res.ok) {
      setRows(res.data.entries)
      setTotal(res.data.total)
      setPageSize(res.data.pageSize)
    } else {
      setRows([])
    }
  }, [q, page])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Field label="Search the trail">
          <Input
            placeholder="Who, what, or any word in the detail"
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
            className="min-w-[320px]"
          />
        </Field>
      </div>

      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="m-0 text-[13px] text-muted">
          {q ? 'Nothing in the trail matches that.' : 'No changes recorded yet. Save something and it appears here.'}
        </p>
      ) : (
        <Table head={['When', 'Who', 'Action', 'Detail']}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="tnum whitespace-nowrap text-muted">
                {new Date(r.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </Td>
              <Td className="whitespace-nowrap">{r.actorEmail}</Td>
              <Td>
                <code className="text-[12px]">{r.action}</code>
              </Td>
              <Td className="text-muted">{r.detail}</Td>
            </tr>
          ))}
        </Table>
      )}

      <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} unit="entries" />
    </Card>
  )
}
