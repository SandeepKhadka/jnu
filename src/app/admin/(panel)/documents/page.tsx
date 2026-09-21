'use client'

import { useState } from 'react'

import { DocumentField } from '@/components/admin/MediaPicker'
import { useSetting } from '@/components/admin/useSetting'
import {
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Loading,
  PageHeader,
  StatusLine,
  Textarea,
} from '@/components/admin/ui'
import { move } from '@/lib/admin-client'
import type { DocumentRow } from '@/lib/content-types'

/**
 * Affiliations and syllabus — the two public pages that are just a list of
 * PDFs.
 *
 * One screen for both because they are the same shape, switched by a tab.
 * Documents come from the media library, so a file uploaded once can be
 * referenced from either list without being stored twice.
 */
export default function DocumentsPage() {
  const [tab, setTab] = useState<'affiliations' | 'syllabus'>('affiliations')
  return (
    <div>
      <PageHeader
        title="Affiliations & syllabus"
        description="The document tables on /affiliations/ and /admission/syllabus/. Each row shows a View link when a PDF is attached."
      />
      <div className="mb-5 flex gap-2">
        <Button variant={tab === 'affiliations' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('affiliations')}>
          Affiliations
        </Button>
        <Button variant={tab === 'syllabus' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('syllabus')}>
          Syllabus
        </Button>
      </div>
      {/* Keyed so switching tabs loads that list rather than reusing the draft. */}
      <DocumentListEditor key={tab} settingKey={tab} />
    </div>
  )
}

function DocumentListEditor({ settingKey }: { settingKey: 'affiliations' | 'syllabus' }) {
  const { value, set, setValue, extra, loading, busy, status, save } = useSetting(settingKey)
  if (loading) return <Loading />

  const names = (extra.documentNames ?? {}) as Record<string, string>
  const rows = value.rows

  function setRow(i: number, patch: Partial<DocumentRow>) {
    setValue((prev) => ({ ...prev, rows: prev.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }))
  }

  const label = settingKey === 'affiliations' ? 'affiliation' : 'syllabus entry'

  return (
    <div>
      <StatusLine status={status} />

      <Card
        title="Introduction"
        description="Optional paragraph shown above the table."
        actions={
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        }
      >
        <Textarea
          rows={3}
          value={value.intro}
          onChange={(e) => set('intro', e.target.value)}
          placeholder={
            settingKey === 'affiliations'
              ? 'The university and its constituent colleges hold the following approvals…'
              : 'Syllabus documents for each programme are listed below…'
          }
        />
      </Card>

      <Card
        title="Rows"
        description="Shown in this order on the public page."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setValue((prev) => ({ ...prev, rows: [...prev.rows, { title: '', note: '', documentId: null }] }))
            }
          >
            Add row
          </Button>
        }
      >
        {rows.length === 0 ? (
          <p className="m-0 text-[13px] text-muted">
            Nothing listed yet. The public page shows a short &ldquo;not yet available&rdquo; message until a row is added.
          </p>
        ) : (
          <div className="space-y-5">
            {rows.map((r, i) => (
              <div key={i} className="rounded border border-hair p-3">
                <div className="mb-2 flex items-center justify-end gap-1">
                  <IconButton label="Move up" onClick={() => setValue((p) => ({ ...p, rows: move(p.rows, i, i - 1) }))}>
                    ↑
                  </IconButton>
                  <IconButton label="Move down" onClick={() => setValue((p) => ({ ...p, rows: move(p.rows, i, i + 1) }))}>
                    ↓
                  </IconButton>
                  <IconButton
                    label={`Remove this ${label}`}
                    onClick={() => setValue((p) => ({ ...p, rows: p.rows.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </IconButton>
                </div>

                <Field label="Title" required hint="The institution or programme this document belongs to.">
                  <Input
                    value={r.title}
                    onChange={(e) => setRow(i, { title: e.target.value })}
                    placeholder={
                      settingKey === 'affiliations'
                        ? 'Jodhpur Pharmacy College — Pharmacy Council of India'
                        : 'B.Tech Computer Science & Engineering'
                    }
                  />
                </Field>

                <div className="mt-3">
                  <Field label="Note" hint="Optional second line, e.g. the letter reference or the session.">
                    <Input value={r.note} onChange={(e) => setRow(i, { note: e.target.value })} />
                  </Field>
                </div>

                <div className="mt-3">
                  <DocumentField
                    label="PDF"
                    hint="Shown as a View link. A row with no document still appears, marked as not yet available."
                    name={r.documentId ? (names[r.documentId] ?? 'Attached document') : null}
                    onPick={(m) => setRow(i, { documentId: m.id })}
                    onClear={() => setRow(i, { documentId: null })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="m-0 mt-4 text-[12px] text-muted">
          A row without a title is dropped when you save.
        </p>
      </Card>
    </div>
  )
}
