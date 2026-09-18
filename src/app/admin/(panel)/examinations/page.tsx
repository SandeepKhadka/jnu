'use client'

import { ImageField } from '@/components/admin/MediaPicker'
import { useSetting } from '@/components/admin/useSetting'
import {
  Button,
  Card,
  Field,
  Input,
  Loading,
  PageHeader,
  Row,
  Select,
  StatusLine,
  Table,
  Td,
} from '@/components/admin/ui'
import { STATIONERY_FIELDS, type StationeryField } from '@/lib/content-types'

/**
 * Examination settings and the degree stationery layout.
 *
 * The layout is millimetre positions on the university's pre-printed
 * certificate blank. Calibrate it with the alignment test on the Degrees
 * screen: print on plain paper, hold it over a blank, adjust, repeat.
 */
export default function ExaminationsPage() {
  const exams = useSetting('examinations')
  const layout = useSetting('certificateLayout')
  if (exams.loading || layout.loading) return <Loading />

  const signatureUrl = (exams.extra.signatureUrl as string | null) ?? null
  const setField = (id: StationeryField, patch: Record<string, unknown>) =>
    layout.set('fields', { ...layout.value.fields, [id]: { ...layout.value.fields[id], ...patch } })

  return (
    <div>
      <PageHeader
        title="Examinations"
        description="What is printed on statements of marks and degrees."
      />
      <StatusLine status={exams.status} />
      <StatusLine status={layout.status} />

      <Card
        title="Statement of marks"
        actions={
          <Button onClick={exams.save} disabled={exams.busy}>
            {exams.busy ? 'Saving…' : 'Save'}
          </Button>
        }
      >
        <Row cols={3}>
          <Field label="Signing officer" hint="Printed under the signature line.">
            <Input value={exams.value.controllerTitle} onChange={(e) => exams.set('controllerTitle', e.target.value)} />
          </Field>
          <Field label="Place" hint="Printed with the date.">
            <Input value={exams.value.place} onChange={(e) => exams.set('place', e.target.value)} />
          </Field>
          <Field label="Examination centre" hint="Printed as the centre name.">
            <Input value={exams.value.centre} onChange={(e) => exams.set('centre', e.target.value)} />
          </Field>
        </Row>

        <div className="mt-4 border-t border-hair pt-4">
          <ImageField
            label="Signature image"
            hint="The signing officer's scanned signature, on a transparent or white background. It appears on marksheets students print, so upload it only with that officer's agreement. Leave empty for a blank signature line."
            url={signatureUrl}
            height={64}
            onPick={(m) => exams.set('signatureId', m.id)}
            onClear={() => exams.set('signatureId', null)}
          />
          <p className="m-0 mt-2 text-[12px] text-muted">
            This image is never included in ordinary public pages — only on a signed-in student&rsquo;s own
            marksheet.
          </p>
        </div>
      </Card>

      <Card
        title="Degree stationery layout"
        description="Where each value is printed on the university's blank certificate, in millimetres from the top-left corner of an A4 landscape sheet."
        actions={
          <Button onClick={layout.save} disabled={layout.busy}>
            {layout.busy ? 'Saving…' : 'Save layout'}
          </Button>
        }
      >
        <Table head={['Value', 'X (mm)', 'Y (mm)', 'Width (mm)', 'Align', 'Size (pt)', 'Style', 'Prefix']}>
          {STATIONERY_FIELDS.map(({ id, label }) => {
            const f = layout.value.fields[id]
            return (
              <tr key={id}>
                <Td className="whitespace-nowrap font-semibold">{label}</Td>
                <Td>
                  <Input
                    type="number"
                    step={0.5}
                    className="w-20"
                    value={f.x}
                    onChange={(e) => setField(id, { x: Number(e.target.value) })}
                  />
                </Td>
                <Td>
                  <Input
                    type="number"
                    step={0.5}
                    className="w-20"
                    value={f.y}
                    onChange={(e) => setField(id, { y: Number(e.target.value) })}
                  />
                </Td>
                <Td>
                  <Input
                    type="number"
                    step={1}
                    className="w-20"
                    value={f.w}
                    onChange={(e) => setField(id, { w: Number(e.target.value) })}
                  />
                </Td>
                <Td>
                  <Select
                    className="w-24"
                    value={f.align}
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'center', label: 'Centre' },
                      { value: 'right', label: 'Right' },
                    ]}
                    onChange={(e) => setField(id, { align: e.target.value })}
                  />
                </Td>
                <Td>
                  <Input
                    type="number"
                    step={0.5}
                    className="w-20"
                    value={f.size}
                    onChange={(e) => setField(id, { size: Number(e.target.value) })}
                  />
                </Td>
                <Td className="whitespace-nowrap">
                  <label className="mr-2 text-[12px]">
                    <input type="checkbox" checked={Boolean(f.bold)} onChange={(e) => setField(id, { bold: e.target.checked })} /> B
                  </label>
                  <label className="mr-2 text-[12px]">
                    <input type="checkbox" checked={Boolean(f.italic)} onChange={(e) => setField(id, { italic: e.target.checked })} /> I
                  </label>
                  <label className="text-[12px]">
                    <input type="checkbox" checked={Boolean(f.caps)} onChange={(e) => setField(id, { caps: e.target.checked })} /> CAPS
                  </label>
                </Td>
                <Td>
                  <Input
                    className="w-28"
                    value={f.prefix ?? ''}
                    onChange={(e) => setField(id, { prefix: e.target.value })}
                  />
                </Td>
              </tr>
            )
          })}
        </Table>

        <Row cols={3}>
          <Field label="QR code — X (mm)">
            <Input
              type="number"
              step={0.5}
              value={layout.value.qr.x}
              onChange={(e) => layout.set('qr', { ...layout.value.qr, x: Number(e.target.value) })}
            />
          </Field>
          <Field label="QR code — Y (mm)">
            <Input
              type="number"
              step={0.5}
              value={layout.value.qr.y}
              onChange={(e) => layout.set('qr', { ...layout.value.qr, y: Number(e.target.value) })}
            />
          </Field>
          <Field label="QR code — size (mm)">
            <Input
              type="number"
              step={1}
              value={layout.value.qr.size}
              onChange={(e) => layout.set('qr', { ...layout.value.qr, size: Number(e.target.value) })}
            />
          </Field>
        </Row>

        <p className="m-0 mt-3 text-[12px] text-muted">
          To calibrate: Degrees → any certificate → Print on stationery → Alignment test. Print it on plain paper
          at 100% scale and lay it over a blank certificate.
        </p>
      </Card>
    </div>
  )
}
