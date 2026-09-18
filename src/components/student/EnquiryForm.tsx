'use client'

import { useState } from 'react'
import { useSite } from '@/components/site/SiteProvider'
import { submitEnquiry } from '@/lib/store'

type State = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Enquiry capture. Posts to /api/enquiries, which validates the input and
 * stores it in the database for staff to read.
 *
 * The honeypot is a deliberate choice over a CAPTCHA: no third-party script,
 * no cookie, nothing to slow the page down. It is checked on the server as
 * well as here, since a bot can simply not run the client-side code.
 */
export function EnquiryForm() {
  const { site } = useSite()
  const [state, setState] = useState<State>('idle')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    programme: '',
    message: '',
    // Honeypot: real users never see or fill this.
    company: '',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.company) {
      // Silently accept and drop — do not tell a bot it was detected.
      setState('sent')
      return
    }

    setState('sending')

    // Stored server-side in the enquiries table, readable by staff through
    // /api/enquiries. The honeypot field is checked on the server too.
    const res = await submitEnquiry({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      programme: form.programme || undefined,
      message: form.message,
      company: form.company || undefined,
    })

    setState(res.ok ? 'sent' : 'error')
  }

  if (state === 'sent') {
    return (
      <div className="panel border-l-[3px] border-l-[#2c6549]">
        <div className="panel-body">
          <p className="m-0 text-[14px] font-semibold text-[#2c6549]">Enquiry received</p>
          <p className="m-0 mt-1 text-[13px] text-muted">
            Thank you. The office will respond to the email address you provided.
          </p>
        </div>
      </div>
    )
  }

  const input = (
    name: 'name' | 'email' | 'phone' | 'programme',
    label: string,
    type = 'text',
    required = true
  ) => (
    <div>
      <label htmlFor={name} className="mb-1 block text-[12px] font-semibold text-jnu-800">
        {label}
        {required ? '' : ' (optional)'}
      </label>
      <input
        id={name}
        type={type}
        required={required}
        autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'off'}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
      />
    </div>
  )

  return (
    <form onSubmit={onSubmit} className="panel no-print">
      <h2 className="panel-head m-0">Send an Enquiry</h2>
      <div className="panel-body">
        <div className="grid gap-3 sm:grid-cols-2">
          {input('name', 'Name')}
          {input('email', 'Email', 'email')}
          {input('phone', 'Phone', 'tel', false)}
          {input('programme', 'Programme of interest', 'text', false)}
        </div>

        <div className="mt-3">
          <label htmlFor="message" className="mb-1 block text-[12px] font-semibold text-jnu-800">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded border border-hair px-2.5 py-1.5 text-[13px] focus:border-jnu-400"
          />
        </div>

        {/* Honeypot, hidden from people and from assistive tech. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            tabIndex={-1}
            autoComplete="off"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>

        {state === 'error' ? (
          <p role="alert" className="m-0 mt-3 text-[13px] font-semibold text-[#a8322b]">
            The enquiry could not be sent. Please email {site.email} instead.
          </p>
        ) : null}

        <p className="m-0 mt-3 text-xs text-muted">
          Your details are used only to answer this enquiry. See the{' '}
          <a href="/privacy/">privacy notice</a>.
        </p>

        <button type="submit" disabled={state === 'sending'} className="btn btn-primary mt-3">
          {state === 'sending' ? 'Sending…' : 'Send enquiry'}
        </button>
      </div>
    </form>
  )
}
