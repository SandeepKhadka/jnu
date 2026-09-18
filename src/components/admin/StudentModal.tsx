'use client'

import { useState } from 'react'

import { postJson, putJson } from '@/lib/admin-client'
import { Button, Field, Input, Modal, Row, Select, Textarea } from './ui'
import { STUDENT_STATUSES } from '@/lib/student-constants'

/**
 * Add or edit a student. Used from the register and from the student page.
 *
 * The roll number and date of birth are the student's sign-in credential and
 * what certificate verification checks, so the form says so rather than
 * leaving staff to find out when a student cannot sign in.
 */
export function StudentModal({
  student,
  onClose,
  onSaved,
  onError,
}: {
  student?: Record<string, unknown>
  onClose: () => void
  onSaved: () => void
  onError: (t: string) => void
}) {
  const [form, setForm] = useState({
    rollNo: (student?.rollNo as string) ?? '',
    enrollmentNo: (student?.enrollmentNo as string) ?? '',
    fullName: (student?.fullName as string) ?? '',
    fatherName: (student?.fatherName as string) ?? '',
    motherName: (student?.motherName as string) ?? '',
    dob: (student?.dob as string) ?? '',
    programme: (student?.programme as string) ?? '',
    status: (student?.status as string) ?? 'ACTIVE',
    mobile: (student?.mobile as string) ?? '',
    email: (student?.email as string) ?? '',
    addressLine: (student?.addressLine as string) ?? '',
    district: (student?.district as string) ?? '',
    state: (student?.state as string) ?? '',
    pincode: (student?.pincode as string) ?? '',
  })
  const [busy, setBusy] = useState(false)
  const id = student?.id as string | undefined

  async function save() {
    setBusy(true)
    const res = id
      ? await putJson(`/api/admin/students/${id}`, form)
      : await postJson('/api/admin/students', form)
    setBusy(false)
    if (!res.ok) {
      onError(res.error)
      return
    }
    onSaved()
  }

  return (
    <Modal title={id ? 'Edit student' : 'Add student'} onClose={onClose} wide>
      <div className="space-y-4">
        <Row cols={3}>
          <Field label="Roll number" required hint="Used to sign in. Letters, digits, / and -.">
            <Input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
          </Field>
          <Field label="Enrollment number" required>
            <Input value={form.enrollmentNo} onChange={(e) => setForm({ ...form, enrollmentNo: e.target.value })} />
          </Field>
          <Field label="Date of birth" required hint="The other half of the student's sign-in. Check it carefully.">
            <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </Field>
          <Field label="Full name" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Father's name" required>
            <Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
          </Field>
          <Field label="Mother's name" required>
            <Input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} />
          </Field>
          <Field label="Programme" required>
            <Input value={form.programme} onChange={(e) => setForm({ ...form, programme: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              options={STUDENT_STATUSES.map((s) => ({ value: s, label: s }))}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </Field>
        </Row>

        <details className="rounded border border-hair p-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-jnu-800">Contact details</summary>
          <Row cols={3}>
            <Field label="Mobile">
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="District">
              <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field label="PIN code">
              <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </Field>
            <Field label="Address" full>
              <Textarea rows={2} value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            </Field>
          </Row>
        </details>

        <Button onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save student'}
        </Button>
      </div>
    </Modal>
  )
}
