'use client'

import { useState } from 'react'
import { site } from '@/content/site'
import { getSupabase } from '@/lib/supabase'

type State = 'idle' | 'sending' | 'sent' | 'error' | 'unconfigured'

/**
 * Enquiry capture. Writes to a Supabase `enquiries` table when configured;
 * otherwise falls back to a mailto link so the page is never a dead end.
 *
 * The honeypot is a deliberate choice over a CAPTCHA: no third-party script,
 * no cookie, nothing to slow the page down. Add Cloudflare Turnstile later if
 * spam volume warrants it.
 */
export function EnquiryForm() {
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

    const supabase = getSupabase()
    if (!supabase) {
      setState('unconfigured')
      return
    }

    setState('sending')
    const { error } = await supabase.from('enquiries').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      programme: form.programme.trim() || null,
      message: form.message.trim(),
    })

    setState(error ? 'error' : 'sent')
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

        {state === 'unconfigured' ? (
          <p role="alert" className="m-0 mt-3 text-[13px] text-muted">
            The enquiry service is not configured yet. Please email{' '}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
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
