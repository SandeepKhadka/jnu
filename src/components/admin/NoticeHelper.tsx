'use client'

import { useState } from 'react'
import { sortedNotices, formatNoticeDate } from '@/content/notices'

/**
 * Notices are build-time content, on purpose.
 *
 * They are public content we want ranked, so they must exist in the static
 * HTML. Storing them in Supabase and fetching them client-side would leave
 * them invisible to crawlers — losing exactly the SEO this project is for.
 *
 * So this tab does not write to a database. It composes the entry and hands
 * over a snippet to paste into content/notices.ts, which triggers a rebuild.
 * Wire a git-backed CMS later if staff should do this unaided (see README).
 */
export function NoticeHelper() {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: today,
    title: '',
    category: 'General',
    href: '',
    file: '',
    pinned: false,
  })
  const [copied, setCopied] = useState(false)

  const id = `n-${form.date}`
  const snippet = [
    '  {',
    `    id: '${id}',`,
    `    date: '${form.date}',`,
    `    title: ${JSON.stringify(form.title || 'Notice title')},`,
    `    category: '${form.category}',`,
    form.href ? `    href: '${form.href}',` : null,
    form.file ? `    file: '${form.file}',` : null,
    form.pinned ? '    pinned: true,' : null,
    '  },',
  ]
    .filter(Boolean)
    .join('\n')

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel border-l-[3px] border-l-jnu-500">
        <div className="panel-body">
          <p className="m-0 text-[13px] text-muted">
            <strong className="text-jnu-800">Why this differs from results:</strong> notices
            are public content that should rank in search, so they are built into the
            static HTML rather than fetched in the browser. Add the generated entry to{' '}
            <code>content/notices.ts</code> and deploy — the notice is live in about 90
            seconds and fully indexable.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-head m-0">Compose a Notice</h2>
        <div className="panel-body">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="n-date" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                Date
              </label>
              <input
                id="n-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
              />
            </div>
            <div>
              <label htmlFor="n-cat" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                Category
              </label>
              <select
                id="n-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
              >
                {['General', 'Examination', 'Admission', 'Placement', 'Result'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="n-title" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                Title
              </label>
              <input
                id="n-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Examination form submission dates — odd semester"
                className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
              />
            </div>
            <div>
              <label htmlFor="n-href" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                Internal link (optional)
              </label>
              <input
                id="n-href"
                value={form.href}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="/admission/fee-structure/"
                className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
              />
            </div>
            <div>
              <label htmlFor="n-file" className="mb-1 block text-[12px] font-semibold text-jnu-800">
                PDF path (optional)
              </label>
              <input
                id="n-file"
                value={form.file}
                onChange={(e) => setForm({ ...form, file: e.target.value })}
                placeholder="/documents/exam-form.pdf"
                className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
              />
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            />
            Pin to the top of the notice board
          </label>

          <h3 className="mb-2 mt-5 font-display text-[14px] uppercase tracking-wide text-jnu-800">
            Paste into content/notices.ts
          </h3>
          <pre className="m-0 overflow-x-auto rounded border border-hair bg-shell p-3 text-[12px] leading-relaxed">
            {snippet}
          </pre>
          <button type="button" onClick={copy} className="btn btn-primary mt-3">
            {copied ? 'Copied' : 'Copy snippet'}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-head m-0">Current Notices ({sortedNotices.length})</h2>
        <div className="panel-body p-0">
          <ul className="m-0 list-none p-0">
            {sortedNotices.map((n) => (
              <li key={n.id} className="flex flex-wrap items-baseline gap-3 border-b border-hair px-4 py-2.5 text-[13px] last:border-b-0">
                <time dateTime={n.date} className="tnum shrink-0 text-muted">
                  {formatNoticeDate(n.date)}
                </time>
                <span className="shrink-0 rounded-sm border border-hair bg-shell px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  {n.category}
                </span>
                <span>{n.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
