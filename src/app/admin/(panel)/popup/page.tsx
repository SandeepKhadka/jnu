'use client'

import { useSetting } from '@/components/admin/useSetting'
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
} from '@/components/admin/ui'

/**
 * The announcement shown over the public site on arrival.
 *
 * Nothing is remembered about who has seen it: it appears on every page load
 * and closing it lasts only for that page. That is the client's call, and it
 * removes the problem the alternative had — an edited notice reaching nobody
 * who had already dismissed the previous one. The cost is that regular
 * visitors see it every visit, so the enabled switch is the control that
 * matters.
 */
export default function PopupNoticePage() {
  const { value, set, setValue, loading, busy, status, save } = useSetting('popupNotice')
  if (loading) return <Loading />

  const links = value.links

  function setLink(i: number, field: 'label' | 'href', v: string) {
    setValue((prev) => ({
      ...prev,
      links: prev.links.map((l, j) => (j === i ? { ...l, [field]: v } : l)),
    }))
  }

  return (
    <div>
      <PageHeader
        title="Pop-up notice"
        description="A dialog shown over the public site about two seconds after a visitor arrives."
        actions={
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        }
      />
      <StatusLine status={status} />

      <Card title="Announcement">
        <Row cols={1}>
          <Check
            label="Show this notice on the website"
            hint="Turn it off to hide the pop-up without deleting what you have written."
            checked={value.enabled}
            onChange={(e) => set('enabled', e.target.checked)}
          />
          <Field label="Title" required hint="Shown in the blue bar at the top of the dialog.">
            <Input
              value={value.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Admissions open for 2026–27"
            />
          </Field>
          <Field label="Message" hint="Plain text. Line breaks are kept.">
            <Textarea
              rows={5}
              value={value.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Applications for the coming session are now open…"
            />
          </Field>
        </Row>
      </Card>

      <Card
        title="Links"
        description="Up to six. Internal paths start with a slash; external links must start with https://."
        actions={
          links.length < 6 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setValue((prev) => ({ ...prev, links: [...prev.links, { label: '', href: '' }] }))}
            >
              Add link
            </Button>
          ) : null
        }
      >
        {links.length === 0 ? (
          <p className="m-0 text-[13px] text-muted">No links. The notice will show its message only.</p>
        ) : (
          <div className="space-y-3">
            {links.map((l, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[180px] flex-1">
                  <Field label="Text">
                    <Input value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder="Apply now" />
                  </Field>
                </div>
                <div className="min-w-[220px] flex-1">
                  <Field label="Link">
                    <Input
                      value={l.href}
                      onChange={(e) => setLink(i, 'href', e.target.value)}
                      placeholder="/admission/process/"
                    />
                  </Field>
                </div>
                <IconButton
                  label="Remove link"
                  onClick={() => setValue((prev) => ({ ...prev, links: prev.links.filter((_, j) => j !== i) }))}
                >
                  ×
                </IconButton>
              </div>
            ))}
          </div>
        )}
        <p className="m-0 mt-3 text-[12px] text-muted">
          A link with an empty text or an unsafe address is dropped when you save.
        </p>
      </Card>

      <Card title="How often it appears">
        <p className="m-0 text-[13px] text-muted">
          The notice appears about two seconds after a page is opened, every time — closing it hides it for
          that page only, and it returns on the next visit or refresh. It does not reappear while someone
          moves between pages on the site.
        </p>
        <p className="m-0 mt-2 text-[13px] text-muted">
          Nothing is remembered about who has seen it, so a notice is never missed by someone who closed it
          before reading it. The other side of that is that regular visitors see it on every visit — switch it
          off above once it has served its purpose.
        </p>
      </Card>
    </div>
  )
}
