'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'

import type { PopupNotice } from '@/lib/content-types'

/**
 * The announcement shown over the page shortly after arrival.
 *
 * Dressed as an official notice rather than a generic dialog: a sand banner,
 * which is already how the notice board marks something important, a ruled
 * heading in the display face, and links presented as rows the way the board
 * presents its entries. The point is that a visitor recognises it as a notice
 * from the university in the moment it appears, not as a website pop-up to be
 * dismissed on reflex.
 *
 * Deliberately NOT rendered on the server: it is an overlay, and putting it in
 * the prerendered HTML would cost layout stability on the page Google
 * measures.
 *
 * Dismissal is NOT remembered. Closing it hides it for that page view, and it
 * comes back on the next load or refresh — the client's decision, so a notice
 * is not missed by anyone who dismissed it before reading it. It is not
 * re-shown on navigation between pages: this component lives in the layout
 * and stays mounted, so the timer runs once per full page load rather than
 * once per link followed.
 */

/**
 * Long enough for the page behind it to paint and settle, short enough not to
 * feel like an afterthought. Note that the wait a visitor experiences is this
 * plus however long the browser took to download and hydrate the page — on a
 * phone that is most of it, which is why this number is small.
 */
const DELAY_MS = 700

export function NoticePopup({ notice }: { notice: PopupNotice }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notice.enabled || !notice.title) return
    const t = window.setTimeout(() => setOpen(true), DELAY_MS)
    return () => window.clearTimeout(t)
  }, [notice.enabled, notice.title])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function close() {
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:items-center"
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
        className="my-8 w-full max-w-lg rounded border border-hair bg-white shadow-chrome focus:outline-none sm:my-0"
      >
        {/*
          Sand banner. The notice board already uses this colour for
          "Important", so the association is the site's own, not a new one.
        */}
        <div
          className="flex items-center justify-between gap-3 rounded-t border-b border-sand-600 px-4 py-2.5 text-white"
          style={{ background: 'linear-gradient(to bottom, #d99b4a 0%, #c8863a 100%)' }}
        >
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[18px] w-[18px] shrink-0" fill="currentColor">
              <path d="M10 1.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm0 3.3a1.1 1.1 0 0 1 1.1 1.2l-.32 4.6a.79.79 0 0 1-1.57 0L8.9 6.1A1.1 1.1 0 0 1 10 4.9Zm0 8.1a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
            </svg>
            <span className="font-display text-[12px] uppercase tracking-[0.14em]">Important Notice</span>
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close notice"
            className="grid h-7 w-7 shrink-0 place-items-center rounded border border-white/40 text-[16px] leading-none text-white hover:bg-white/15"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          {/* The ruled heading the section headings across the site use. */}
          <h2
            id={titleId}
            className="relative m-0 mb-4 pb-2.5 font-display text-[18px] leading-snug text-jnu-800"
            style={{ borderBottom: '1px solid #e1e1e1' }}
          >
            {notice.title}
            <span aria-hidden="true" className="absolute bottom-0 left-0 block h-[3px] w-14 bg-sand-400" />
          </h2>

          {notice.body ? (
            <p className="m-0 whitespace-pre-line text-[14px] leading-relaxed text-ink">{notice.body}</p>
          ) : null}

          {/*
            Points, not links. They are read, not followed: nothing here
            navigates, so a visitor cannot be carried out of the notice by a
            mistaken tap. Red because these are the lines the notice most
            wants read; `#a8322b` is the same red the panel already uses for
            destructive and attention text, so it is not a new colour.
          */}
          {notice.points.length > 0 ? (
            <ul className="m-0 mt-4 list-none overflow-hidden rounded border border-hair p-0">
              {notice.points.map((point, i) => (
                <li
                  key={`${i}-${point}`}
                  className="m-0 border-b border-hair bg-white px-3 py-2.5 text-[13.5px] font-semibold leading-snug text-[#a8322b] last:border-b-0"
                >
                  <span aria-hidden="true" className="mr-2">
                    ›
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-b border-t border-hair bg-shell px-5 py-3">
          <Link href="/notices/" onClick={close} className="text-[12px] font-semibold uppercase tracking-wide">
            All notices
          </Link>
          <button type="button" onClick={close} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
