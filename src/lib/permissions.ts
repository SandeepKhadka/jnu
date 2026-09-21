/**
 * Who may do what in the admin panel.
 *
 * One table, read by BOTH the API routes (requirePermission in lib/auth.ts —
 * the actual enforcement) and the admin UI (which sections and buttons to
 * show). Keeping them on one table means the UI can never offer an action the
 * server will refuse, and hiding a button is never the only thing in the way.
 *
 * Client-safe: no server imports.
 */

export type Role = 'admin' | 'registrar' | 'exam_cell' | 'editor'

export const ROLES: { id: Role; label: string; summary: string }[] = [
  {
    id: 'admin',
    label: 'Administrator',
    summary: 'Everything, including staff accounts and every setting.',
  },
  {
    id: 'registrar',
    label: 'Registrar',
    summary:
      'Students, degrees, correction requests, admissions, recognition and examination settings.',
  },
  {
    id: 'exam_cell',
    label: 'Examination Cell',
    summary: 'Students, results and photograph approvals.',
  },
  {
    id: 'editor',
    label: 'Content Editor',
    summary: 'Website content: pages, programmes, notices, carousel, gallery, menu and branding.',
  },
]

export type Permission =
  // website content
  | 'content.edit' // pages, notices, carousel, gallery, media, menu, homepage, site details
  | 'programmes.edit' // faculties and programmes
  | 'branding.edit' // logo, crest, share image
  | 'recognition.edit' // UGC / approval statements — evidence required
  | 'exams.settings' // controller title, signature, centre, certificate layout
  // academic records
  | 'students.view'
  | 'students.edit'
  | 'students.delete'
  | 'results.manage'
  | 'certificates.view'
  | 'certificates.issue' // issue, print on stationery, revoke, reinstate
  | 'reviews.photos'
  | 'reviews.corrections'
  // admissions
  | 'applications.manage'
  | 'enquiries.manage'
  | 'counselling.manage' // online counselling requests from the public site
  // system
  | 'staff.manage'
  | 'audit.view'

const MATRIX: Record<Permission, Role[]> = {
  'content.edit': ['admin', 'editor'],
  'programmes.edit': ['admin', 'editor'],
  'branding.edit': ['admin', 'editor'],
  // A recognition statement on a university website is a legal claim, and
  // this institution's recognition history makes an unevidenced one the most
  // damaging thing the site could publish. Not an editor's call.
  'recognition.edit': ['admin', 'registrar'],
  'exams.settings': ['admin', 'registrar'],

  'students.view': ['admin', 'registrar', 'exam_cell'],
  'students.edit': ['admin', 'registrar', 'exam_cell'],
  'students.delete': ['admin', 'registrar'],
  'results.manage': ['admin', 'registrar', 'exam_cell'],
  'certificates.view': ['admin', 'registrar', 'exam_cell'],
  'certificates.issue': ['admin', 'registrar'],
  'reviews.photos': ['admin', 'registrar', 'exam_cell'],
  'reviews.corrections': ['admin', 'registrar'],

  'applications.manage': ['admin', 'registrar'],
  'enquiries.manage': ['admin', 'registrar', 'editor'],
  // Counselling requests can carry an identity document, so they sit with
  // admissions rather than with general enquiries — an editor has no reason
  // to see someone's Aadhaar scan.
  'counselling.manage': ['admin', 'registrar'],

  'staff.manage': ['admin'],
  'audit.view': ['admin', 'registrar'],
}

export function can(role: Role | string | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return MATRIX[permission].includes(role as Role)
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.some((r) => r.id === value)
}

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.id === role)?.label ?? role
}

/** Minimum staff password length. Long beats complex; enforced server-side. */
export const MIN_STAFF_PASSWORD = 12
