/**
 * Student constants shared by the server and the admin screens.
 *
 * Separate from student-input.ts, which is server-only: a client component
 * importing that would pull server code into the browser bundle.
 */
export const STUDENT_STATUSES = ['ACTIVE', 'GRADUATED', 'WITHDRAWN'] as const

export type StudentStatus = (typeof STUDENT_STATUSES)[number]
