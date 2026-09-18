'use client'

import { move } from '@/lib/admin-client'
import { useSetting } from '@/components/admin/useSetting'
import {
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Loading,
  PageHeader,
  Row,
  StatusLine,
  StringList,
  Textarea,
} from '@/components/admin/ui'

/** Every piece of text on the home page. */
export default function HomepagePage() {
  const { value, set, loading, busy, status, save } = useSetting('home')
  if (loading) return <Loading />

  const saveBtn = (
    <Button onClick={save} disabled={busy}>
      {busy ? 'Saving…' : 'Save changes'}
    </Button>
  )

  return (
    <div>
      <PageHeader
        title="Homepage"
        description="The words on the home page. Photographs for the slideshow are under Carousel."
        actions={saveBtn}
      />
      <StatusLine status={status} />

      <Card
        title="Headline"
        description="Sits over the slideshow. The headline is the page's main heading — the single most important line for search."
      >
        <Row cols={1}>
          <Field label="Small line above the headline" hint="Usually the university's name.">
            <Input value={value.heroEyebrow} onChange={(e) => set('heroEyebrow', e.target.value)} />
          </Field>
          <Field label="Headline" required>
            <Input value={value.heroHeadline} onChange={(e) => set('heroHeadline', e.target.value)} />
          </Field>
          <Field label="Supporting sentence">
            <Textarea rows={2} value={value.heroBody} onChange={(e) => set('heroBody', e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field label="Main button">
            <div className="flex gap-2">
              <Input
                placeholder="Label"
                value={value.primaryCta.label}
                onChange={(e) => set('primaryCta', { ...value.primaryCta, label: e.target.value })}
              />
              <Input
                placeholder="/programmes/"
                value={value.primaryCta.href}
                onChange={(e) => set('primaryCta', { ...value.primaryCta, href: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Second button">
            <div className="flex gap-2">
              <Input
                placeholder="Label"
                value={value.secondaryCta.label}
                onChange={(e) => set('secondaryCta', { ...value.secondaryCta, label: e.target.value })}
              />
              <Input
                placeholder="/admission/process/"
                value={value.secondaryCta.href}
                onChange={(e) => set('secondaryCta', { ...value.secondaryCta, href: e.target.value })}
              />
            </div>
          </Field>
        </Row>
      </Card>

      <Card title="Quick access cards" description="The four boxes under the slideshow.">
        <div className="space-y-3">
          {value.quickCards.map((c, i) => (
            <div key={i} className="rounded border border-hair p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Card {i + 1}</span>
                <div className="flex gap-1">
                  <IconButton label="Move up" onClick={() => set('quickCards', move(value.quickCards, i, i - 1))}>
                    ↑
                  </IconButton>
                  <IconButton label="Move down" onClick={() => set('quickCards', move(value.quickCards, i, i + 1))}>
                    ↓
                  </IconButton>
                  <IconButton
                    label="Remove card"
                    danger
                    onClick={() => set('quickCards', value.quickCards.filter((_, j) => j !== i))}
                  >
                    ×
                  </IconButton>
                </div>
              </div>
              <Row cols={3}>
                <Field label="Title">
                  <Input
                    value={c.label}
                    onChange={(e) =>
                      set('quickCards', value.quickCards.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                  />
                </Field>
                <Field label="Link">
                  <Input
                    value={c.href}
                    onChange={(e) =>
                      set('quickCards', value.quickCards.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))
                    }
                  />
                </Field>
                <Field label="Symbol" hint="One character, e.g. ✎ ₹ ◈ ✓">
                  <Input
                    value={c.icon}
                    onChange={(e) =>
                      set('quickCards', value.quickCards.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))
                    }
                  />
                </Field>
                <Field label="Description" full>
                  <Input
                    value={c.text}
                    onChange={(e) =>
                      set('quickCards', value.quickCards.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                    }
                  />
                </Field>
              </Row>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => set('quickCards', [...value.quickCards, { label: '', href: '/', icon: '◈', text: '' }])}
          >
            Add card
          </Button>
        </div>
      </Card>

      <Card title="About section">
        <Row cols={1}>
          <Field label="Heading">
            <Input value={value.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} />
          </Field>
          <Field label="Paragraphs">
            <StringList
              values={value.aboutParagraphs}
              onChange={(v) => set('aboutParagraphs', v)}
              addLabel="Add paragraph"
              textarea
            />
          </Field>
        </Row>
      </Card>

      <Card
        title="Frequently asked questions"
        description="These appear on the page and are also sent to Google as structured data, so they can show directly in search results. Answer plainly and factually."
      >
        <div className="space-y-3">
          {value.faqs.map((f, i) => (
            <div key={i} className="rounded border border-hair p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Question {i + 1}</span>
                <div className="flex gap-1">
                  <IconButton label="Move up" onClick={() => set('faqs', move(value.faqs, i, i - 1))}>
                    ↑
                  </IconButton>
                  <IconButton label="Move down" onClick={() => set('faqs', move(value.faqs, i, i + 1))}>
                    ↓
                  </IconButton>
                  <IconButton label="Remove" danger onClick={() => set('faqs', value.faqs.filter((_, j) => j !== i))}>
                    ×
                  </IconButton>
                </div>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Question"
                  value={f.q}
                  onChange={(e) => set('faqs', value.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                />
                <Textarea
                  rows={3}
                  placeholder="Answer"
                  value={f.a}
                  onChange={(e) => set('faqs', value.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                />
              </div>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => set('faqs', [...value.faqs, { q: '', a: '' }])}>
            Add question
          </Button>
        </div>
      </Card>

      {saveBtn}
    </div>
  )
}
