/**
 * Tells every mounted component that the student session changed.
 *
 * The masthead menu and the student portal are separate client components
 * with no common parent below the root layout, and the session lives in an
 * httpOnly cookie that neither can read. Without this, signing in on the
 * portal would leave the header still saying "Login" until a full page load,
 * and signing out from the header would leave the portal showing a record for
 * someone who is no longer signed in.
 */

const EVENT = 'jnu:student-session'

export function announceStudentSessionChanged(): void {
  window.dispatchEvent(new Event(EVENT))
}

/** Subscribes to session changes. Returns the unsubscribe function. */
export function onStudentSessionChanged(handler: () => void): () => void {
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
