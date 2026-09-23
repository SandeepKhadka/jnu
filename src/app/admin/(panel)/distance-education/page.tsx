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
  StatusLine,
  Textarea,
} from '@/components/admin/ui'
import { move } from '@/lib/admin-client'
import type { DistanceProgramme } from '@/lib/content-types'

/**
 * Distance education — the page at /distance-education/ and the programmes
 * listed on it.
 *
 * Create, edit, reorder, publish and delete, all on one screen, because the
 * whole thing is one settings document: a table of a dozen programmes is not
 * worth a row-per-request API, and saving it in one piece means a half-applied
 * edit is impossible.
 */
export default function DistanceEducationPage() {
  const { value, set, setValue, loading, busy, status, save } = useSetting('distanceEducation')
  if (loading) return <Loading />

  const programmes = value.programmes

  function setProgramme(i: number, patch: Partial<DistanceProgramme>) {
    setValue((prev) => ({
      ...prev,
      programmes: prev.programmes.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    }))
  }

  const blank: DistanceProgramme = {
    name: '',
    award: '',
    duration: '',
    eligibility: '',
    fee: '',
    published: true,
  }

  return (
    <div>
      <PageHeader
        title="Distance education"
        description="The public page at /distance-education/ and the programmes listed on it."
        actions={
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />
      <StatusLine status={status} />

      <Card
        title="The page"
        description="While this is off the page is not on the website at all, and the menu entry is hidden."
      >
        <Check
          label="Show the Distance Education page on the website"
          checked={value.enabled}
          onChange={(e) => set('enabled', e.target.checked)}
        />

        <div className="mt-4">
          <Field
            label="Introduction"
            hint="Shown above the table. Longer prose can go in Pages, at the path /distance-education/."
          >
            <Textarea
              rows={3}
              value={value.intro}
              onChange={(e) => set('intro', e.target.value)}
              placeholder="The university offers the following programmes in distance mode…"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label="Approval statement"
            hint="Leave empty unless you hold the letter. Distance programmes need UGC-DEB recognition, and an approval claim the university cannot evidence is the most damaging thing this site can publish. The page reads perfectly well without this line."
          >
            <Textarea
              rows={2}
              value={value.approvalNote}
              onChange={(e) => set('approvalNote', e.target.value)}
              placeholder="(leave blank until the approval letter is on file)"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Footnote" hint="Optional small print below the table — fee conditions, contact, and so on.">
            <Textarea
              rows={2}
              value={value.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Fees are per year and exclude examination charges…"
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Programmes"
        description="Listed in this order on the public page. Unpublished rows stay here but are not shown."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setValue((prev) => ({ ...prev, programmes: [...prev.programmes, blank] }))}
          >
            Add programme
          </Button>
        }
      >
        {programmes.length === 0 ? (
          <p className="m-0 text-[13px] text-muted">
            No programmes yet. Add one, or leave the page switched off until there are some.
          </p>
        ) : (
          <div className="space-y-5">
            {programmes.map((p, i) => (
              <div key={i} className="rounded border border-hair p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Check
                    label="Published"
                    checked={p.published}
                    onChange={(e) => setProgramme(i, { published: e.target.checked })}
                  />
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="Move up"
                      onClick={() =>
                        setValue((prev) => ({ ...prev, programmes: move(prev.programmes, i, i - 1) }))
                      }
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      label="Move down"
                      onClick={() =>
                        setValue((prev) => ({ ...prev, programmes: move(prev.programmes, i, i + 1) }))
                      }
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      label="Remove this programme"
                      onClick={() =>
                        setValue((prev) => ({
                          ...prev,
                          programmes: prev.programmes.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      ×
                    </IconButton>
                  </div>
                </div>

                <Field label="Programme" required>
                  <Input
                    value={p.name}
                    onChange={(e) => setProgramme(i, { name: e.target.value })}
                    placeholder="Bachelor of Arts"
                  />
                </Field>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Award" hint="What the student receives, if it differs from the name.">
                    <Input
                      value={p.award}
                      onChange={(e) => setProgramme(i, { award: e.target.value })}
                      placeholder="B.A."
                    />
                  </Field>
                  <Field label="Duration">
                    <Input
                      value={p.duration}
                      onChange={(e) => setProgramme(i, { duration: e.target.value })}
                      placeholder="3 years"
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Eligibility">
                    <Input
                      value={p.eligibility}
                      onChange={(e) => setProgramme(i, { eligibility: e.target.value })}
                      placeholder="10+2 from a recognised board"
                    />
                  </Field>
                  <Field label="Fee">
                    <Input
                      value={p.fee}
                      onChange={(e) => setProgramme(i, { fee: e.target.value })}
                      placeholder="₹12,000 per year"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
