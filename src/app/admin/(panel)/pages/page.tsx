'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { del, getJson, postJson } from '@/lib/admin-client'
import type { PageDTO } from '@/lib/content-dto'
import {
  Button,
  Card,
  ConfirmButton,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Pill,
  StatusLine,
  Table,
  Td,
  Textarea,
  useStatus,
} from '@/components/admin/ui'

/** Every content page on the site. */
export default function PagesList() {
  const router = useRouter()
  const [pages, setPages] = useState<PageDTO[] | null>(null)
  const [adding, setAdding] = useState(false)
  const { status, show } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ pages: PageDTO[] }>('/api/admin/pages')
    if (res.ok) setPages(res.data.pages)
    else show({ tone: 'error', text: res.error })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function remove(p: PageDTO) {
    const res = await del(`/api/admin/pages/${p.id}`)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return
    }
    show({ tone: 'ok', text: `Deleted ${p.path}` })
    await load()
  }

  return (
    <div>
      <PageHeader
        title="Pages"
        description="The text pages of the website. The home page, notices, verification and contact pages have their own screens or are built from other data."
        actions={<Button onClick={() => setAdding(true)}>New page</Button>}
      />
      <StatusLine status={status} />

      {pages === null ? (
        <Loading />
      ) : (
        <Card>
          <Table head={['URL', 'Title', 'Status', 'Last edited', '']}>
            {pages.map((p) => (
              <tr key={p.id}>
                <Td className="whitespace-nowrap font-mono text-[12px]">{p.path}</Td>
                <Td>
                  <Link href={`/admin/pages/${p.id}`} className="font-semibold text-jnu-700">
                    {p.title}
                  </Link>
                  <span className="block text-[11.5px] text-muted">{p.description.slice(0, 90)}…</span>
                </Td>
                <Td>{p.published ? <Pill tone="ok">Published</Pill> : <Pill tone="muted">Draft</Pill>}</Td>
                <Td className="tnum whitespace-nowrap text-[12px] text-muted">{p.updatedAt.slice(0, 10)}</Td>
                <Td className="whitespace-nowrap text-right">
                  <Link href={`/admin/pages/${p.id}`} className="mr-3 text-[12px] text-jnu-700 underline">
                    Edit
                  </Link>
                  <a href={p.path} target="_blank" rel="noreferrer" className="mr-3 text-[12px] text-jnu-700 underline">
                    View
                  </a>
                  <ConfirmButton question={`Delete ${p.path}? Anyone following an existing link will get a "page not found".`} onConfirm={() => remove(p)}>
                    Delete
                  </ConfirmButton>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {adding ? (
        <NewPage
          onClose={() => setAdding(false)}
          onCreated={(id) => router.push(`/admin/pages/${id}`)}
          onError={(text) => show({ tone: 'error', text })}
        />
      ) : null}
    </div>
  )
}

function NewPage({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void
  onCreated: (id: string) => void
  onError: (text: string) => void
}) {
  const [path, setPath] = useState('/')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  async function create() {
    setBusy(true)
    const res = await postJson<{ id: string }>('/api/admin/pages', { path, title, description, body: [] })
    setBusy(false)
    if (!res.ok) {
      onError(res.error)
      return
    }
    onCreated(res.data.id)
  }

  return (
    <Modal title="New page" onClose={onClose}>
      <div className="space-y-4">
        <Field label="URL" required hint="Lowercase words and hyphens, e.g. /about/hostels/">
          <Input value={path} onChange={(e) => setPath(e.target.value)} />
        </Field>
        <Field label="Title" required hint="Shown as the page heading and in search results.">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field
          label="Description"
          required
          hint="The sentence Google shows under the title. Around 155 characters."
        >
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Button onClick={create} disabled={busy}>
          {busy ? 'Creating…' : 'Create and edit'}
        </Button>
      </div>
    </Modal>
  )
}
