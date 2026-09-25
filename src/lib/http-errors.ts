/**
 * What to say when a request fails and the server sent no message of its own.
 *
 * These are the cases where a route handler never ran, or crashed before it
 * could explain itself — so there is no JSON to read and the only thing on
 * hand is a number. "Request failed (413)" is developer language. The person
 * reading it is a registrar uploading a syllabus, or a student checking a
 * result, and a status code tells them nothing about what to do next.
 *
 * Every message names a likely cause and a next action, and none of them
 * mentions the number.
 *
 * A message the SERVER sends always wins over these: those are written for
 * the reader and name the actual record ("JNU2024BT0147 already holds a
 * result for Semester IV"). This is only the fallback.
 *
 * Neutral module with no imports, so both the admin wrapper and the public
 * one can use it and the wording cannot drift apart.
 */
export function statusMessage(status: number): string {
  switch (status) {
    case 401:
      return 'Your session has ended. Sign in again, then repeat what you were doing.'
    case 403:
      return 'Your account does not have permission to do that. Ask an administrator if you need it.'
    case 404:
      return 'That item no longer exists — it may have been deleted by someone else. Reload the page.'
    /*
     * 413 never comes from this application: the host, or the CDN in front of
     * it, refused the body before any route handler ran. The ceiling is
     * invisible and much lower than the one the media library advertises —
     * Vercel Functions cap a request body at 4.5 MB, which cannot be raised at
     * any plan level, and Cloudflare's free tier caps at 100 MB. A 20 MB scan
     * the library would happily accept is rejected upstream, silently.
     */
    case 413:
      return (
        'This file is too large to upload. Compress it — a scan usually shrinks to a ' +
        'tenth of its size at ilovepdf.com/compress_pdf — and try again. The limit ' +
        'here is set by the hosting platform, not by the website.'
      )
    case 429:
      return 'Too many attempts in a short time. Wait a minute and try again.'
    case 408:
    case 504:
      return 'The server took too long to answer. Check your connection and try again.'
    case 500:
    case 502:
    case 503:
      return 'Something went wrong on the server. Try again — if it keeps happening, report it.'
    default:
      return 'The action could not be completed. Try again — if it keeps happening, report it.'
  }
}
