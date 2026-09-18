'use client'

import { createContext, useContext } from 'react'

import {
  DEFAULT_EXAMINATIONS,
  DEFAULT_RECOGNITION,
  DEFAULT_SITE,
  FALLBACK_BRANDING,
  type Recognition,
  type ResolvedBranding,
  type SiteSettings,
} from '@/lib/content-types'

/**
 * Site settings for CLIENT components (forms, verification pages, the
 * marksheet), which cannot query the database themselves. The root layout
 * reads the settings on the server and provides them here.
 *
 * What is NOT in here, on purpose: the Controller of Examinations' signature.
 * This value is serialised into every public page's HTML, and a scanned
 * signature available from every page of the site is a forgery aid. The
 * marksheet receives it from /api/student/me, only for a signed-in student.
 */
export type SiteContextValue = {
  site: SiteSettings
  branding: ResolvedBranding
  recognition: Recognition
  examinations: { controllerTitle: string; place: string; centre: string }
}

const SiteContext = createContext<SiteContextValue>({
  site: DEFAULT_SITE,
  branding: FALLBACK_BRANDING,
  recognition: DEFAULT_RECOGNITION,
  examinations: {
    controllerTitle: DEFAULT_EXAMINATIONS.controllerTitle,
    place: DEFAULT_EXAMINATIONS.place,
    centre: DEFAULT_EXAMINATIONS.centre,
  },
})

export function SiteProvider({
  value,
  children,
}: {
  value: SiteContextValue
  children: React.ReactNode
}) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite(): SiteContextValue {
  return useContext(SiteContext)
}
