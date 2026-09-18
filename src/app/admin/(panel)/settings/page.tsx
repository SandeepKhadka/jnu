'use client'

import { useSetting } from '@/components/admin/useSetting'
import { Button, Card, Field, Input, Loading, PageHeader, Row, StatusLine, StringList, Textarea } from '@/components/admin/ui'

/** Site details: names, contact, addresses, search-result text, social links. */
export default function SiteSettingsPage() {
  const { value, set, loading, busy, status, save } = useSetting('site')
  if (loading) return <Loading />

  return (
    <div>
      <PageHeader
        title="Site details"
        description="The university's name, contact details and addresses, used across the website, the marksheet and the structured data search engines read."
        actions={
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />
      <StatusLine status={status} />

      <Card title="Name">
        <Row cols={3}>
          <Field label="Full name" required hint="Shown in headings, schema and on documents.">
            <Input value={value.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Short name" hint="Used where space is tight.">
            <Input value={value.shortName} onChange={(e) => set('shortName', e.target.value)} />
          </Field>
          <Field label="Legal name" hint="For the footer and legal notices.">
            <Input value={value.legalName} onChange={(e) => set('legalName', e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input value={value.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label="Established" hint="Year, e.g. 2008. Shown in the footer and the seal.">
            <Input value={value.established} onChange={(e) => set('established', e.target.value)} />
          </Field>
        </Row>
      </Card>

      <Card
        title="Search results"
        description="How the home page appears in Google. Keep the title near 60 characters and the description near 155."
      >
        <Row cols={1}>
          <Field label="Home page title" required hint={`${value.defaultTitle.length} characters`}>
            <Input value={value.defaultTitle} onChange={(e) => set('defaultTitle', e.target.value)} />
          </Field>
          <Field
            label="Title pattern for other pages"
            required
            hint="%s is replaced by the page's own title. Example: %s | Jodhpur National University"
          >
            <Input value={value.titleTemplate} onChange={(e) => set('titleTemplate', e.target.value)} />
          </Field>
          <Field label="Home page description" required hint={`${value.defaultDescription.length} characters`}>
            <Textarea rows={3} value={value.defaultDescription} onChange={(e) => set('defaultDescription', e.target.value)} />
          </Field>
        </Row>
      </Card>

      <Card title="Contact">
        <Row cols={3}>
          <Field label="General email" required>
            <Input type="email" value={value.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Telephone" hint="Shown in the header bar when set.">
            <Input value={value.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field
            label="Verification email"
            hint="Printed on certificates and shown on the verification pages. Use an address someone actually monitors."
          >
            <Input type="email" value={value.verificationEmail} onChange={(e) => set('verificationEmail', e.target.value)} />
          </Field>
        </Row>
      </Card>

      <Card title="Addresses">
        <Row>
          <Field label="Campus label">
            <Input value={value.campus.label} onChange={(e) => set('campus', { ...value.campus, label: e.target.value })} />
          </Field>
          <Field label="Office label">
            <Input
              value={value.admissionOffice.label}
              onChange={(e) => set('admissionOffice', { ...value.admissionOffice, label: e.target.value })}
            />
          </Field>
          <Field label="Campus address" hint="One line per row.">
            <StringList
              values={value.campus.lines}
              onChange={(lines) => set('campus', { ...value.campus, lines })}
            />
          </Field>
          <Field label="Office address" hint="One line per row.">
            <StringList
              values={value.admissionOffice.lines}
              onChange={(lines) => set('admissionOffice', { ...value.admissionOffice, lines })}
            />
          </Field>
        </Row>
      </Card>

      <Card
        title="Social profiles"
        description="Full https:// addresses. These are published as the university's official profiles in search engine structured data, so only add accounts the university controls."
      >
        <Row cols={3}>
          {(['facebook', 'twitter', 'linkedin', 'youtube', 'instagram'] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <Input
                placeholder="https://"
                value={value.social[k]}
                onChange={(e) => set('social', { ...value.social, [k]: e.target.value })}
              />
            </Field>
          ))}
        </Row>
      </Card>

      <Button onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
