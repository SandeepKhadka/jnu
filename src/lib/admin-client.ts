'use client'

/**
 * The admin panel's fetch wrapper.
 *
 * Every screen talks to the API through this, so error handling, the trailing
 * slash and the session cookie are dealt with once. It never throws: callers
 * get { ok } and show `error` verbatim, because the server's messages are
 * written to be read by staff ("JNU2024BT0147 already holds …"), not
 * translated into something vaguer here.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number }

function withSlash(path: string): string {
  const [base, query] = path.split('?')
  const normalised = base.endsWith('/') ? base : `${base}/`
  return query ? `${normalised}?${query}` : normalised
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const isForm = init?.body instanceof FormData
    const res = await fetch(withSlash(path), {
      ...init,
      headers: {
        // The browser must set Content-Type itself for multipart, with its
        // boundary; setting it by hand breaks uploads.
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers ?? {}),
      },
      credentials: 'same-origin',
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      /*
       * 413 does not come from this application. The host or the CDN in front
       * of it refused the body before any route handler ran, so there is no
       * JSON error to read and the generic "Request failed (413)" tells the
       * reader nothing they can act on.
       *
       * It is worth naming because the ceiling is invisible and much lower
       * than the app's own: Vercel Functions cap a request body at 4.5 MB and
       * that cannot be raised at any plan level, while Cloudflare's free tier
       * caps at 100 MB. A 20 MB scan the media library would happily accept
       * is rejected upstream with no explanation at all.
       */
      if (res.status === 413) {
        return {
          ok: false,
          status: 413,
          error:
            'The server refused this upload because the file is too large for the ' +
            'hosting platform — this limit is outside the website and cannot be ' +
            'changed here. Compress the file and try again, or upload it from a ' +
            'server without this restriction.',
        }
      }
      return { ok: false, status: res.status, error: data?.error ?? `Request failed (${res.status}).` }
    }
    return { ok: true, data: data as T }
  } catch {
    return { ok: false, status: 0, error: 'Could not reach the server. Check your connection.' }
  }
}

export const getJson = <T,>(path: string) => api<T>(path)
export const postJson = <T,>(path: string, value: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(value) })
export const putJson = <T,>(path: string, value: unknown) =>
  api<T>(path, { method: 'PUT', body: JSON.stringify(value) })
export const patchJson = <T,>(path: string, value: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(value) })
export const del = <T,>(path: string) => api<T>(path, { method: 'DELETE' })

/** Moves item `from` to `to` in a copy of the list. */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
