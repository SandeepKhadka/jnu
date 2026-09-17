'use client'

import { useEffect, useState } from 'react'
import { listAudit, type AuditEntry } from '@/lib/store'

/**
 * Append-only trail of every result and certificate change, read from the
 * database.
 *
 * Worth having even in a project: results and certificate records are exactly
 * the data most worth tampering with, and "who changed this, and when" is the
 * first question anyone asks afterwards. Entries are written server-side by
 * the API routes, so they cannot be edited or cleared from the browser.
 */
export function AuditLog() {
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listAudit().then((entries) => {
      if (cancelled) return
      setRows(entries)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="panel">
        <h2 className="panel-head m-0 flex items-center justify-between">
          <span>Audit Log</span>
          <span className="tnum text-[11px] font-normal text-muted">
            {loading ? 'loading…' : `${rows.length} entries`}
          </span>
        </h2>
        <div className="panel-body p-0">
          {loading ? (
            <p className="m-0 px-4 py-6 text-[13px] text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="m-0 px-4 py-6 text-[13px] text-muted">
              No changes recorded yet. Add, publish or revoke something and it will appear
              here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">When</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Actor</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Action</th>
                    <th className="border-b border-hair bg-shell px-3 py-2 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.at}-${i}`}>
                      <td className="tnum whitespace-nowrap border-b border-hair px-3 py-2 text-muted">
                        {new Date(r.at).toLocaleString('en-IN')}
                      </td>
                      <td className="border-b border-hair px-3 py-2">{r.actor}</td>
                      <td className="border-b border-hair px-3 py-2">
                        <code className="text-[12px]">{r.action}</code>
                      </td>
                      <td className="border-b border-hair px-3 py-2 text-muted">{r.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="panel border-l-[3px] border-l-sand-500">
        <h2 className="panel-head m-0">Resetting the demo data</h2>
        <div className="panel-body">
          <p className="m-0 mb-2 text-[13px] text-muted">
            Data now lives in the database rather than the browser, so resetting is a
            command rather than a button:
          </p>
          <pre className="m-0 overflow-x-auto rounded border border-hair bg-shell p-3 text-[12px]">
            npm run db:reset
          </pre>
          <p className="m-0 mt-2 text-[12px] text-muted">
            That drops the database, re-applies the migrations and re-seeds it. Run it
            before demonstrating the project to someone.
          </p>
        </div>
      </div>
    </div>
  )
}
