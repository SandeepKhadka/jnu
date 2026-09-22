'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'

import type { PopupNotice } from '@/lib/content-types'

/**
 * The announcement shown over the page shortly after arrival.
 *
 * Deliberately NOT rendered on the server: the notice is an overlay, and
 * putting it in the prerendered HTML would mean it flashed up before the CSS
 * settled and counted against the page's layout stability. Mounting it after
 * a short delay keeps the static HTML — the thing Google indexes — exactly
 * as it was.
 *
 * Dismissal is NOT remembered. Closing it hides it for that page view, and it
 * comes back on the next load or refresh — the client's decision, so a notice
 * is not missed by anyone who dismissed it before reading it. It is not
 * re-shown on navigation between pages: this component lives in the layout
 * and stays mounted, so the timer runs once per full page load rather than
 * once per link followed.
 */
export function NoticePopup({ notice }: { notice: PopupNotice }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notice.enabled || !notice.title) return
    const t = window.setTimeout(() => setOpen(true), 2000)
    return () => window.clearTimeout(t)
  }, [notice.enabled, notice.title])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-lg rounded border border-hair bg-white shadow-chrome focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hair bg-jnu-700 px-5 py-3">
          <h2 id={titleId} className="m-0 font-display text-[15px] uppercase tracking-wide text-white">
            {notice.title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close notice"
            className="grid h-7 w-7 shrink-0 place-items-center rounded border border-white/30 text-[16px] leading-none text-white hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4">
          {notice.body ? (
            <p className="m-0 whitespace-pre-line text-[13.5px] leading-relaxed text-jnu-900">{notice.body}</p>
          ) : null}

          {notice.links.length > 0 ? (
            <ul className="m-0 mt-4 list-none space-y-2 p-0">
              {notice.links.map((l) => (
                <li key={`${l.href}-${l.label}`} className="m-0">
                  {l.href.startsWith('/') ? (
                    <Link
                      href={l.href}
                      onClick={close}
                      className="text-[13px] font-semibold text-jnu-700 underline hover:text-jnu-800"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      onClick={close}
                      className="text-[13px] font-semibold text-jnu-700 underline hover:text-jnu-800"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <button type="button" onClick={close} className="btn btn-secondary mt-5">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
