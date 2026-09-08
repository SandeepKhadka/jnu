'use client'

import { useEffect, useState } from 'react'
import { listAudit, resetDemoData, type AuditEntry } from '@/lib/store'

/**
 * Append-only trail of every result and certificate change.
 *
 * Worth having even in a demo: results and certificate records are exactly the
 * data most worth tampering with, and "who changed this, and when" is the
 * first question anyone asks afterwards.
 */
export function AuditLog() {
  const [rows, setRows] = useState<AuditEntry[]>([])

  useEffect(() => {
    setRows(listAudit())
  }, [])

  function onReset() {
    if (
      !window.confirm(
        'Reset all demo data?\n\nThis clears every result, certificate and audit entry you have added and restores the original seed data. It cannot be undone.'
      )
    ) {
      return
    }
    resetDemoData()
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="panel">
        <h2 className="panel-head m-0 flex items-center justify-between">
          <span>Audit Log</span>
          <span className="tnum text-[11px] font-normal text-muted">{rows.length} entries</span>
        </h2>
        <div className="panel-body p-0">
          {rows.length === 0 ? (
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

      <div className="panel border-l-[3px] border-l-[#a8322b]">
        <h2 className="panel-head m-0">Reset Demo Data</h2>
        <div className="panel-body">
          <p className="m-0 mb-3 text-[13px] text-muted">
            Clears everything saved in this browser and restores the original seed data —
            useful before demonstrating the project to someone.
          </p>
          <button type="button" onClick={onReset} className="btn btn-secondary">
            Reset to seed data
          </button>
        </div>
      </div>
    </div>
  )
}
