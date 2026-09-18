/**
 * Rules shared by the printed statement of marks and the public page that
 * verifies it. Kept in one file so the two can never disagree about what a
 * serial looks like or which division a percentage earns.
 */

/* -------------------------------------------------------------- serial --- */

/**
 * Crockford base32: no I, L, O or U, so a serial read off paper and typed in
 * by hand cannot be mistyped as 1/0 or spell anything unfortunate.
 */
export const SERIAL_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const SERIAL_LENGTH = 12

/** `7K3MQ9XA2BCD` → `JNU-SOM-7K3M-Q9XA-2BCD`, the form printed on the sheet. */
export function formatSerial(token: string): string {
  return `JNU-SOM-${token.match(/.{1,4}/g)?.join('-') ?? token}`
}

/**
 * Accepts a serial however it was typed or scanned — with or without the
 * prefix and dashes, any case, with the letters people commonly substitute —
 * and returns the bare 12-character token, or null.
 */
export function parseSerial(input: string): string | null {
  const bare = input
    .toUpperCase()
    .replace(/^JNU-?SOM-?/, '')
    .replace(/[\s-]/g, '')
    // Crockford's decoding rules for the look-alikes it excludes.
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')

  if (bare.length !== SERIAL_LENGTH) return null
  for (const ch of bare) if (!SERIAL_ALPHABET.includes(ch)) return null
  return bare
}

/* ------------------------------------------------------------ division --- */

/**
 * Division from percentage, for a PASS result.
 *
 * REGISTRAR TO CONFIRM these thresholds against the university's ordinance
 * before launch. They are the common Indian university convention, not a
 * rule taken from JNU's own regulations, and a division printed on a
 * statement of marks is exactly the kind of thing a student will rely on.
 */
export const DIVISION_THRESHOLDS = [
  { min: 75, label: 'First Division with Distinction' },
  { min: 60, label: 'First Division' },
  { min: 45, label: 'Second Division' },
  { min: 0, label: 'Third Division' },
] as const

export function divisionFor(
  status: 'PASS' | 'FAIL' | 'ATKT' | 'WITHHELD',
  percentage: number
): string {
  if (status === 'ATKT') return 'ATKT'
  if (status === 'FAIL') return '—'
  if (status === 'WITHHELD') return 'Withheld'
  return DIVISION_THRESHOLDS.find((t) => percentage >= t.min)?.label ?? '—'
}

export function percentageOf(obtained: number, max: number): number {
  return max > 0 ? (obtained / max) * 100 : 0
}

/** `2005-04-12` → `12 / 04 / 2005`, the form on the printed sheet. */
export function sheetDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d} / ${m} / ${y}` : iso
}

/** ISO timestamp → `10.04.2026`, for the "Dated" line. */
export function dottedDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}.${m}.${y}` : iso
}
