'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { BlockEditor } from '@/components/admin/BlockEditor'
import {
  Button,
  Card,
  Check,
  Field,
  IconButton,
  Input,
  Loading,
  PageHeader,
  Row,
  StatusLine,
  Textarea,
  useStatus,
} from '@/components/admin/ui'
import { getJson, move, putJson } from '@/lib/admin-client'
import type { PageDTO } from '@/lib/content-dto'
import type { Block, Crumb } from '@/lib/content-types'

/** Edit one content page: its search details, breadcrumb trail and body. */
export default function PageEditor() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState<PageDTO | null>(null)
  const [system, setSystem] = useState(false)
  const [busy, setBusy] = useState(false)
  const { status, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ page: PageDTO; system: boolean }>(`/api/admin/pages/${id}`)
    if (res.ok) {
      setPage(res.data.page)
      setSystem(res.data.system)
    } else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (!page) return <Loading />

  const set = <K extends keyof PageDTO>(k: K, v: PageDTO[K]) => setPage({ ...page, [k]: v })

  async function save() {
    setBusy(true)
    const res = await putJson(`/api/admin/pages/${id}`, page)
    setBusy(false)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    saved()
  }

  const saveBtn = (
    <Button onClick={save} disabled={busy}>
      {busy ? 'Saving…' : 'Save page'}
    </Button>
  )

  return (
    <div>
      <PageHeader
        title={page.title || 'Page'}
        description={page.path}
        actions={
          <>
            <a href={page.path} target="_blank" rel="noreferrer">
              <Button variant="secondary">View page ↗</Button>
            </a>
            {saveBtn}
          </>
        }
      />
      <StatusLine status={status} />
      <p className="mb-4 text-[12px]">
        <Link href="/admin/pages" className="text-jnu-700 underline">
          ← All pages
        </Link>
      </p>

      <Card title="Search and URL">
        <Row>
          <Field
            label="URL"
            required
            hint={
              system
                ? 'Fixed: another part of the site links to this page by its address.'
                : 'Changing this breaks existing links to the old address.'
            }
          >
            <Input value={page.path} disabled={system} onChange={(e) => set('path', e.target.value)} />
          </Field>
          <Field label="Title" required hint={`${page.title.length} characters — aim for under 60.`}>
            <Input value={page.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Description" required full hint={`${page.description.length} characters — aim for 140–160.`}>
            <Textarea rows={2} value={page.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Introduction" hint="A short line under the page heading. Optional.">
            <Textarea rows={2} value={page.intro ?? ''} onChange={(e) => set('intro', e.target.value)} />
          </Field>
          <div className="flex items-end pb-1">
            <Check
              label="Published"
              hint={system ? 'This page is part of the site structure and stays published.' : 'Unpublished pages return “page not found”.'}
              checked={page.published}
              disabled={system}
              onChange={(e) => set('published', e.target.checked)}
            />
          </div>
        </Row>
      </Card>

      <Card title="Breadcrumb trail" description="Shown above the heading and given to search engines. Home is added automatically.">
        <div className="space-y-2">
          {page.crumbs.map((c: Crumb, i: number) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-[240px]"
                placeholder="Label"
                value={c.name}
                onChange={(e) => set('crumbs', page.crumbs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <Input
                className="max-w-[280px]"
                placeholder="/about/"
                value={c.path}
                onChange={(e) => set('crumbs', page.crumbs.map((x, j) => (j === i ? { ...x, path: e.target.value } : x)))}
              />
              <IconButton label="Move up" onClick={() => set('crumbs', move(page.crumbs, i, i - 1))}>
                ↑
              </IconButton>
              <IconButton label="Move down" onClick={() => set('crumbs', move(page.crumbs, i, i + 1))}>
                ↓
              </IconButton>
              <IconButton label="Remove" danger onClick={() => set('crumbs', page.crumbs.filter((_, j) => j !== i))}>
                ×
              </IconButton>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => set('crumbs', [...page.crumbs, { name: page.title, path: page.path }])}
          >
            Add step
          </Button>
        </div>
      </Card>

      <Card title="Page content">
        <BlockEditor blocks={page.body} onChange={(b: Block[]) => set('body', b)} />
      </Card>

      {saveBtn}
    </div>
  )
}
