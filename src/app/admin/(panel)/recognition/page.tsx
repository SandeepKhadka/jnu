'use client'

import { useSetting } from '@/components/admin/useSetting'
import {
  Button,
  Card,
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
 * Recognition and approvals.
 *
 * The server refuses to store a claim without a document reference and the
 * date it was checked — the rule the whole site has followed from the start.
 * Nothing appears in the footer, on the accreditation page or in search
 * engine data until both are recorded.
 */
export default function RecognitionPage() {
  const { value, set, loading, busy, status, save } = useSetting('recognition')
  if (loading) return <Loading />

  const hasClaim = Boolean(value.ugcStatus) || value.approvals.length > 0

  return (
    <div>
      <PageHeader
        title="Recognition & approvals"
        description="What the website says about the university's statutory recognition."
        actions={
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        }
      />
      <StatusLine status={status} />

      <div className="mb-5 rounded border border-sand-500 bg-white p-4 text-[13px]">
        <p className="m-0 font-semibold text-jnu-800">Publish only what the university can evidence on request</p>
        <p className="m-0 mt-1 text-muted">
          A recognition statement on a university website is relied on by applicants and their families, and by
          employers checking a degree. Record the approval letter or notification that supports it, and the date
          someone last confirmed it is current. Statements without both are not saved.
        </p>
        <p className="m-0 mt-2 text-muted">
          Applicants should be able to confirm the position independently, from UGC, AICTE, PCI, BCI, NCTE or INC
          as applicable — the Accreditation page tells them how.
        </p>
      </div>

      <Card title="Statement">
        <Row cols={1}>
          <Field
            label="Recognition statement"
            hint="One sentence, shown in the footer. For example: Recognised under Section 2(f) of the UGC Act, 1956. Leave empty to publish nothing."
          >
            <Textarea rows={2} value={value.ugcStatus} onChange={(e) => set('ugcStatus', e.target.value)} />
          </Field>
          <Field label="Approving bodies" hint="One per line, e.g. AICTE, PCI. Published as the university's accreditors in structured data.">
            <StringList values={value.approvals} onChange={(v) => set('approvals', v)} addLabel="Add body" />
          </Field>
        </Row>
      </Card>

      <Card title="Evidence" description={hasClaim ? 'Required while any statement above is filled in.' : 'Required as soon as a statement is added.'}>
        <Row>
          <Field label="Document on file" required={hasClaim} hint="Letter or notification number and its date.">
            <Input
              placeholder="e.g. UGC letter F.9-12/2008(CPP-I) dated 14 March 2009"
              value={value.evidence}
              onChange={(e) => set('evidence', e.target.value)}
            />
          </Field>
          <Field label="Last verified" required={hasClaim} hint="The date someone last confirmed this is still current.">
            <Input type="date" value={value.lastVerified} onChange={(e) => set('lastVerified', e.target.value)} />
          </Field>
        </Row>
      </Card>

      <Button onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}
