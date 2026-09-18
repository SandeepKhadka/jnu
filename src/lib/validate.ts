/**
 * Field validators shared by every route that accepts contact details.
 *
 * The admission form and the student profile both take a mobile number, an
 * email address and a postal address. One copy of the rules means a number
 * the admission form accepts can never be rejected by the profile page, or
 * the other way round.
 */

import { INDIAN_STATES } from '@/content/india'

/**
 * Indian mobile numbers are ten digits beginning 6–9. Accepts the +91 or 0
 * prefix and any spacing or dashes the person typed, and returns the bare ten
 * digits, or null.
 */
export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

/** Six digits, not starting with zero. */
export function isPincode(input: string): boolean {
  return /^[1-9]\d{5}$/.test(input)
}

export function isIndianState(input: string): boolean {
  return INDIAN_STATES.includes(input)
}
