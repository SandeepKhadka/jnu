'use client'

import { useSetting } from '@/components/admin/useSetting'
import {
  Button,
  Card,
  Check,
  Field,
  Input,
  Loading,
  PageHeader,
  Row,
  StatusLine,
  StringList,
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

  return (
    <div>
      <PageHeader
        title="Pop-up notice"
        description="A dialog shown over the public site shortly after a visitor arrives."
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
          <Field label="Title" required hint="Shown as the notice heading.">
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
        title="Key points"
        description="Up to six short lines, shown in red beneath the message. They are text, not links: nothing in the notice is clickable, so nobody is carried out of it by a mistaken tap."
      >
        <StringList
          values={value.points}
          onChange={(points) => set('points', points)}
          addLabel="Add a point"
          placeholder="Last date for applications is 30 June"
        />
        <p className="m-0 mt-3 text-[12px] text-muted">
          Empty lines are dropped when you save. If people need to go somewhere, say where in the message and
          let them find it from the menu — a notice that navigates away is a notice nobody finishes reading.
        </p>
      </Card>

      <Card title="How often it appears">
        <p className="m-0 text-[13px] text-muted">
          The notice appears a moment after a page is opened, every time — closing it hides it for
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
