import { Cinzel, EB_Garamond } from 'next/font/google'

/**
 * Typefaces for the printed statement of marks only.
 *
 * Imported solely by MarksheetDocument, so the CSS and font files are part of
 * that chunk and no public page pays for them. Self-hosted by next/font at
 * build time, so a student printing offline or behind a campus proxy still
 * gets the right type rather than a fallback serif.
 *
 * Cinzel: engraved Roman capitals — the institutional name and headings.
 * EB Garamond: the italic sub-title and formal running text.
 */
export const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
})

export const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
})
