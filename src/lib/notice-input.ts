import 'server-only'

import { db } from '@/lib/db'
import { InputError, s } from '@/lib/admin-route'
import { NOTICE_CATEGORIES, safeHref, safeId } from '@/lib/content-types'

/** Validates a notice from the admin form. Throws InputError with a message. */
export async function noticeInput(input: Record<string, unknown>) {
  const title = s(input.title, 300)
  const date = s(input.date, 10)
  if (!title) throw new InputError('A title is required.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new InputError('Enter the notice date.')

  const category = NOTICE_CATEGORIES.includes(input.category as (typeof NOTICE_CATEGORIES)[number])
    ? (input.category as string)
    : 'General'

  const href = safeHref(input.href) || null
  if (input.href && !href) throw new InputError('Links must be a page on this site (starting with /) or an https:// address.')

  const fileId = safeId(input.fileId)
  if (fileId) {
    const m = await db.media.findUnique({ where: { id: fileId }, select: { kind: true } })
    if (!m) throw new InputError('The attached file no longer exists.')
  }

  return {
    title,
    date,
    category,
    href,
    fileId,
    pinned: input.pinned === true,
    published: input.published !== false,
  }
}
