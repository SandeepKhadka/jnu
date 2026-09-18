/**
 * The identity fields a student may ask to have corrected, and their labels.
 *
 * These are exactly the fields PATCH /api/student/me refuses to touch. The
 * student can see them and request a change; only staff can apply it, because
 * these are what certificate verification checks against.
 *
 * Roll and enrollment numbers are deliberately absent: they are keys that
 * results and certificates hang off, not facts about the person, and a
 * "correction" to one is a records operation for the registrar, not a form.
 *
 * Shared by the API route, the student profile UI and the admin review screen,
 * so the three can never disagree about what is correctable.
 */
export const CORRECTABLE_FIELDS = {
  fullName: 'Name',
  fatherName: "Father's name",
  motherName: "Mother's name",
  dob: 'Date of birth',
  programme: 'Programme',
} as const

export type CorrectableField = keyof typeof CORRECTABLE_FIELDS

export function isCorrectableField(value: unknown): value is CorrectableField {
  return typeof value === 'string' && value in CORRECTABLE_FIELDS
}
