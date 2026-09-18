import 'server-only'

import { revalidatePath, revalidateTag } from 'next/cache'

import { CONTENT_TAG } from '@/lib/content'

/**
 * Called by every admin route that changes public content.
 *
 * Invalidates the cached content reads AND every prerendered page, so the
 * change is live on the next request — no redeploy. Deliberately broad: the
 * menu, footer and branding appear on every page, so almost any edit touches
 * all of them, and content edits are rare enough that precision would buy
 * nothing but the risk of a stale page somewhere.
 */
export function revalidateContent(): void {
  revalidateTag(CONTENT_TAG)
  revalidatePath('/', 'layout')
}
