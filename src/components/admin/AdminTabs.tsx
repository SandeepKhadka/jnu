'use client'

import { useState } from 'react'
import { ResultsManager } from './ResultsManager'
import { CertificateRecords } from './CertificateRecords'
import { NoticeHelper } from './NoticeHelper'

type Tab = 'results' | 'certificates' | 'notices'

const TABS: { id: Tab; label: string }[] = [
  { id: 'results', label: 'Examination Results' },
  { id: 'certificates', label: 'Certificate Register' },
  { id: 'notices', label: 'Notices' },
]

export function AdminTabs() {
  const [tab, setTab] = useState<Tab>('results')

  return (
    <div>
      <div role="tablist" aria-label="Administration sections" className="mb-6 flex flex-wrap gap-1 border-b border-hair">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px rounded-t border border-b-0 px-4 py-2 text-[13px] font-semibold uppercase tracking-wide ${
                active
                  ? 'border-hair bg-white text-jnu-800'
                  : 'border-transparent text-muted hover:text-jnu-700'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'results' ? <ResultsManager /> : null}
        {tab === 'certificates' ? <CertificateRecords /> : null}
        {tab === 'notices' ? <NoticeHelper /> : null}
      </div>
    </div>
  )
}
