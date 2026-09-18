import 'server-only'

import { InputError, int, s } from '@/lib/admin-route'
import { PROGRAMME_MODES, slugify } from '@/lib/content-types'

/** Validates a programme from the admin form. Throws InputError with a message. */
export function programmeInput(input: Record<string, unknown>) {
  const name = s(input.name, 160)
  const award = s(input.award, 40)
  const eligibility = s(input.eligibility, 500)
  const durationMonths = int(input.durationMonths, 1, 120)
  const mode = PROGRAMME_MODES.includes(input.mode as (typeof PROGRAMME_MODES)[number])
    ? (input.mode as string)
    : 'Full-time'
  const intake = input.intake === '' || input.intake == null ? null : int(input.intake, 1, 10000)
  const slug = slugify(s(input.slug, 80) || name)

  if (!name) throw new InputError('A programme name is required.')
  if (!award) throw new InputError('The award (e.g. B.Tech, MBA) is required.')
  if (!durationMonths) throw new InputError('Enter the duration in months.')
  if (!eligibility) throw new InputError('Eligibility is required — it is the first thing applicants look for.')
  if (!slug) throw new InputError('Could not make a URL from that name.')

  return {
    name,
    award,
    eligibility,
    durationMonths,
    mode,
    intake,
    slug,
    published: input.published !== false,
  }
}
