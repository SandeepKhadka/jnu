import localFont from 'next/font/local'

/**
 * Typefaces for the printed statement of marks only.
 *
 * Imported solely by MarksheetDocument, so the CSS and font files are part of
 * that chunk and no public page pays for them.
 *
 * Cinzel: engraved Roman capitals — the institutional name and headings.
 * EB Garamond: the italic sub-title and formal running text.
 *
 * The files live in ./fonts rather than coming from next/font/google, because
 * the Google loader downloads its CSS from fonts.googleapis.com *during the
 * build*. When a builder cannot reach Google the loader runs a regex over the
 * empty response and dies on `.match(...)[1]` — reported as a bare
 * `TypeError: Cannot read properties of null (reading '1')` pointing at this
 * file, which says nothing about the network. That took a production build
 * down twice. Committing the fonts makes the build reproducible offline and
 * removes a third party from the critical path of every deploy.
 *
 * These are the latin-subset variable files Google itself serves, so one file
 * covers each weight range and the rendered result is unchanged. To refresh
 * them, re-download the `woff2` URLs from the Google Fonts CSS for
 * `Cinzel:wght@600;700` and `EB+Garamond:ital,wght@0,400;0,500;1,400;1,500`.
 */

export const cinzel = localFont({
  src: [{ path: './fonts/cinzel-latin.woff2', weight: '600 700', style: 'normal' }],
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})

export const garamond = localFont({
  src: [
    { path: './fonts/ebgaramond-latin.woff2', weight: '400 500', style: 'normal' },
    { path: './fonts/ebgaramond-latin-italic.woff2', weight: '400 500', style: 'italic' },
  ],
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})
