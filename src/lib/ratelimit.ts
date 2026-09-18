import 'server-only'

import { db } from '@/lib/db'

/**
 * Fixed-window rate limiting, backed by the database.
 *
 * Roll number + date of birth is a guessable credential: roll numbers run in
 * sequence (JNU2024BT0147, 0148, …) and one cohort's dates of birth span only
 * a few years, so the whole space is small enough to walk. Since the record
 * behind it now includes a photograph and both parents' names, an unlimited
 * endpoint would be an identity-theft kit with a search box.
 *
 * The counter lives in the database rather than in a module-level Map because
 * a Map resets on every cold start, and on a serverless host that is often
 * enough to be no limit at all.
 */

export type LimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

/** Best-effort client address. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Counts one attempt against (bucket, key).
 *
 * Fails OPEN on a database error: a student locked out of their own result
 * because the limiter itself is broken is a worse outcome than a brief gap in
 * throttling, and the per-account lockout in student-auth still applies.
 */
export async function rateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<LimitResult> {
  const now = new Date()
  const windowStartCutoff = new Date(now.getTime() - windowSeconds * 1000)

  try {
    const existing = await db.rateLimit.findUnique({ where: { bucket_key: { bucket, key } } })

    if (!existing || existing.windowStart < windowStartCutoff) {
      // No window, or the previous one has expired — start a fresh one.
      await db.rateLimit.upsert({
        where: { bucket_key: { bucket, key } },
        create: { bucket, key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      })
      return { allowed: true }
    }

    if (existing.count >= limit) {
      const elapsed = (now.getTime() - existing.windowStart.getTime()) / 1000
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(windowSeconds - elapsed)) }
    }

    await db.rateLimit.update({
      where: { bucket_key: { bucket, key } },
      data: { count: { increment: 1 } },
    })
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

/**
 * Clears the counter after a success, so a student who mistypes their date of
 * birth twice and then gets it right is not still carrying those attempts.
 */
export async function clearRateLimit(bucket: string, key: string): Promise<void> {
  await db.rateLimit
    .delete({ where: { bucket_key: { bucket, key } } })
    .catch(() => {})
}

/** Removes expired windows. Called opportunistically, never on the hot path. */
export async function pruneRateLimits(olderThanSeconds = 3600): Promise<void> {
  await db.rateLimit
    .deleteMany({ where: { windowStart: { lt: new Date(Date.now() - olderThanSeconds * 1000) } } })
    .catch(() => {})
}
