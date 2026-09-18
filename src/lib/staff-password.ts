import 'server-only'

import { randomBytes } from 'node:crypto'

/**
 * A readable one-time password for a new or reset staff account.
 *
 * Words plus four hex characters: easy to read out over a desk, ~40 bits of
 * entropy, and short-lived — the account is flagged mustChangePassword, so it
 * can do nothing but set a real password, and the value is shown to the
 * administrator once rather than emailed by this system.
 */
export function temporaryPassword(): string {
  const words = ['jodhpur', 'marwar', 'boranada', 'mehrangarh', 'khejri', 'aravalli', 'thar', 'jhanwar']
  const pick = () => words[randomBytes(1)[0] % words.length]
  return `${pick()}-${pick()}-${randomBytes(2).toString('hex')}`
}
