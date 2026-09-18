'use client'

import { useRef, useState } from 'react'

import { INDIAN_STATES, RAJASTHAN_DISTRICTS } from '@/content/india'
import { useSite } from '@/components/site/SiteProvider'
import { submitApplication } from '@/lib/store'

/**
 * The admission application form.
 *
 * Submitted as multipart/form-data because three documents come with it. Every
 * rule enforced here is enforced again server-side in /api/applications —
 * client-side validation is for the applicant's benefit, never for the
 * database's.
 *
 * On the Aadhaar field: the form asks for the LAST FOUR DIGITS only, never the
 * full twelve. UIDAI requires masking for entities that are not authorised
 * authentication agencies, and under the DPDP Act 2023 holding more personal
 * data than the purpose needs is a liability rather than an asset. Four digits
 * is enough for the admissions office to match an applicant to the document
 * they uploaded, which is the only thing it is for.
 */

type Status =
  | { kind: 'editing' }
  | { kind: 'submitting' }
  | { kind: 'done'; applicationNo: string | null }
  | { kind: 'error'; message: string }

export type ProgrammeOption = { faculty: string; programmes: { name: string; award: string }[] }

export function AdmissionForm({ programmes }: { programmes: ProgrammeOption[] }) {
  const { site } = useSite()
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<Status>({ kind: 'editing' })
  const [state, setState] = useState('Rajasthan')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    setStatus({ kind: 'submitting' })
    const res = await submitApplication(form)

    if (!res.ok) {
      setStatus({ kind: 'error', message: res.error })
      // Keep what the applicant typed. Making someone re-key a long form
      // because one field was wrong is how applications get abandoned.
      return
    }

    setStatus({ kind: 'done', applicationNo: res.applicationNo })
    formRef.current?.reset()
  }

  if (status.kind === 'done') {
    return (
      <div className="panel border-l-[3px] border-l-[#2c6549]">
        <h2 className="panel-head m-0">Application received</h2>
        <div className="panel-body">
          {status.applicationNo ? (
            <p className="m-0 mb-3 text-[14px]">
              Your application number is{' '}
              <span className="tnum font-semibold text-jnu-800">{status.applicationNo}</span>.
              Keep it — you will need it for any correspondence about this application.
            </p>
          ) : null}
          <p className="m-0 text-[13.5px] text-muted">
            The admissions office will contact you on the mobile number and email address you
            gave. No payment should ever be made outside the published fee structure; if
            anyone asks you for money to progress this application, report it to{' '}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
          <p className="m-0 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStatus({ kind: 'editing' })}
            >
              Submit another application
            </button>
          </p>
        </div>
      </div>
    )
  }

  const busy = status.kind === 'submitting'

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate={false} className="panel">
      <h2 className="panel-head m-0">Application for Admission</h2>
      <div className="panel-body">
        {/* Honeypot. Hidden from people, irresistible to bots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Section title="Candidate">
          <Text name="fullName" label="Full name" required autoComplete="name" maxLength={120} />
          <Text name="fatherName" label="Father's name" required maxLength={120} />
          <Text name="motherName" label="Mother's name" required maxLength={120} />
          <Field name="dob" label="Date of birth" required>
            <input
              id="dob"
              name="dob"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              className="tnum w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
          </Field>
        </Section>

        <Section title="Contact">
          <Field name="mobile" label="Mobile number" required>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel"
              pattern="(\+91|0)?[6-9][0-9]{9}"
              placeholder="9876543210"
              className="tnum w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
          </Field>
          <Field name="email" label="Email address" required>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={160}
              className="w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
          </Field>
        </Section>

        <Section title="Address">
          <Field name="state" label="State / Union territory" required>
            <select
              id="state"
              name="state"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded border border-hair bg-white px-3 py-2 text-[14px] focus:border-jnu-400"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field name="district" label="District" required>
            <input
              id="district"
              name="district"
              type="text"
              required
              maxLength={80}
              // Suggestions, not a closed list: India has 780+ districts and
              // states reorganise them, so a fixed dropdown would eventually
              // block a real applicant from entering their real address.
              list={state === 'Rajasthan' ? 'rajasthan-districts' : undefined}
              className="w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
            {state === 'Rajasthan' ? (
              <datalist id="rajasthan-districts">
                {RAJASTHAN_DISTRICTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            ) : null}
          </Field>

          <Field name="address" label="Full address" required full>
            <textarea
              id="address"
              name="address"
              required
              rows={3}
              maxLength={500}
              autoComplete="street-address"
              placeholder="House / street, locality, city or village"
              className="w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
          </Field>

          <Field name="pincode" label="PIN code" required>
            <input
              id="pincode"
              name="pincode"
              type="text"
              required
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              placeholder="342003"
              className="tnum w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
          </Field>
        </Section>

        <Section title="Programme applied for">
          <Field name="programme" label="Course" required full>
            <select
              id="programme"
              name="programme"
              required
              defaultValue=""
              className="w-full rounded border border-hair bg-white px-3 py-2 text-[14px] focus:border-jnu-400"
            >
              <option value="" disabled>
                Select a programme…
              </option>
              {programmes.map((f) => (
                  <optgroup key={f.faculty} label={f.faculty}>
                    {f.programmes.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.award})
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </Field>
        </Section>

        <Section title="Qualification">
          <Text
            name="qualification"
            label="Highest qualification"
            required
            maxLength={120}
            placeholder="e.g. 10+2 Science, B.Sc"
          />
          <Text
            name="qualificationBoard"
            label="Board or university"
            maxLength={120}
            placeholder="e.g. RBSE, CBSE"
          />
          <Field name="qualificationYear" label="Year of passing">
            <input
              id="qualificationYear"
              name="qualificationYear"
              type="number"
              inputMode="numeric"
              min={1950}
              max={new Date().getFullYear()}
              className="tnum w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
          </Field>
          <Field name="qualificationPct" label="Percentage / CGPA %">
            <input
              id="qualificationPct"
              name="qualificationPct"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.01"
              className="tnum w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
          </Field>
        </Section>

        <Section title="Documents">
          <FileField
            name="photo"
            label="Passport photograph"
            required
            accept="image/jpeg,image/png,image/webp"
            hint="JPG, PNG or WebP, up to 2 MB."
          />
          <FileField
            name="aadhaar"
            label="Aadhaar card"
            required
            accept="image/jpeg,image/png,application/pdf"
            hint="JPG, PNG or PDF, up to 5 MB. Please upload a masked Aadhaar."
          />
          <Field name="aadhaarLast4" label="Aadhaar — last 4 digits only">
            <input
              id="aadhaarLast4"
              name="aadhaarLast4"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="1234"
              className="tnum w-full max-w-[120px] rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
            />
            <p className="m-0 mt-1.5 text-xs text-muted">
              Do not enter the full 12-digit number. The university does not store it.
            </p>
          </Field>
          <FileField
            name="qualificationDoc"
            label="Qualification certificate"
            accept="image/jpeg,image/png,application/pdf"
            hint="Optional at this stage. JPG, PNG or PDF, up to 5 MB."
          />
        </Section>

        <p className="m-0 mt-6 rounded border border-hair bg-shell px-3 py-2 text-xs text-muted">
          The documents you upload are stored for processing this application and are visible
          only to admissions staff. See the <a href="/privacy/">privacy notice</a>. Submitting
          this form does not by itself constitute admission or an offer of a place.
        </p>

        {status.kind === 'error' ? (
          <p
            role="alert"
            className="m-0 mt-4 rounded border border-[#a8322b] bg-[#fdf4f3] px-3 py-2 text-[13px] text-[#a8322b]"
          >
            {status.message}
          </p>
        ) : null}

        <p className="m-0 mt-5">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </p>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------- fields --- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 mb-7 border-0 p-0 last:mb-0">
      <legend className="mb-3 block w-full border-b border-hair pb-1.5 font-display text-[13px] uppercase tracking-wide text-jnu-800">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Field({
  name,
  label,
  required = false,
  full = false,
  children,
}: {
  name: string
  label: string
  required?: boolean
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <label htmlFor={name} className="mb-1.5 block text-[13px] font-semibold text-jnu-800">
        {label}
        {required ? (
          <span className="ml-1 text-[#a8322b]" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
    </div>
  )
}

function Text({
  name,
  label,
  required = false,
  ...rest
}: {
  name: string
  label: string
  required?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field name={name} label={label} required={required}>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        className="w-full rounded border border-hair px-3 py-2 text-[14px] focus:border-jnu-400"
        {...rest}
      />
    </Field>
  )
}

function FileField({
  name,
  label,
  accept,
  hint,
  required = false,
}: {
  name: string
  label: string
  accept: string
  hint: string
  required?: boolean
}) {
  return (
    <Field name={name} label={label} required={required}>
      <input
        id={name}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="w-full rounded border border-hair bg-white px-3 py-2 text-[13px] file:mr-3 file:rounded file:border-0 file:bg-shell file:px-3 file:py-1.5 file:text-[13px] file:text-jnu-800"
      />
      <p className="m-0 mt-1.5 text-xs text-muted">{hint}</p>
    </Field>
  )
}
