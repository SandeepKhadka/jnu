'use client'

/**
 * Client-side data access.
 *
 * Every function here is a thin fetch against the API routes in src/app/api.
 * Nothing is read from or written to the browser any more — the database is
 * the single source of truth, and the server decides what a caller is allowed
 * to see.
 *
 * The important consequence: unpublished results and password hashes never
 * reach the browser at all. Previously the whole dataset shipped to the client
 * and only the UI hid the parts a student should not see.
 *
 * The signatures are unchanged from the localStorage version, so the
 * components did not need rewriting.
 */

export type Subject = {
  code: string
  name: string
  max: number
  obtained: number
  grade: string
}

export type ResultRecord = {
  id: string
  roll_no: string
  student_name: string
  programme: string
  semester: string
  exam_session: string
  subjects: Subject[]
  marks_obtained: number
  marks_max: number
  sgpa: number
  status: 'PASS' | 'FAIL' | 'ATKT' | 'WITHHELD'
  published: boolean
}

export type CertificateRecord = {
  id: string
  certificate_no: string
  student_name: string
  programme: string
  award_year: number
  enrollment_no: string
  division: string
  status: 'VERIFIED' | 'REVOKED' | 'WITHHELD'
  registrar_remarks?: string | null
  issued_on: string
}

export type Session = {
  id: string
  email: string
  full_name: string
  role: 'registrar' | 'exam_cell' | 'editor'
}

export type AuditEntry = {
  at: string
  actor: string
  action: string
  detail: string
}

/* ------------------------------------------------------------- plumbing --- */

/**
 * `trailingSlash: true` in next.config.mjs applies to API routes as well as
 * pages, so `/api/results` answers with a 308 to `/api/results/`. That still
 * works — 308 preserves the method and body — but it doubles every request.
 * Adding the slash before the query string avoids the redirect entirely.
 */
function withTrailingSlash(path: string): string {
  const [base, query] = path.split('?')
  const normalised = base.endsWith('/') ? base : `${base}/`
  return query ? `${normalised}?${query}` : normalised
}

async function api<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(withTrailingSlash(path), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      // Session cookie must ride along on every request.
      credentials: 'same-origin',
    })

    const body = await res.json().catch(() => null)

    if (!res.ok) {
      return { ok: false, error: body?.error ?? `Request failed (${res.status}).` }
    }
    return { ok: true, data: body as T }
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' }
  }
}

/** Maps a database row to the shape the components already expect. */
type ApiResult = {
  id: string
  rollNo: string
  studentName: string
  programme: string
  semester: string
  examSession: string
  subjects: Subject[]
  marksObtained: number
  marksMax: number
  sgpa: number
  status: ResultRecord['status']
  published?: boolean
}

function toResult(r: ApiResult): ResultRecord {
  return {
    id: r.id ?? `${r.rollNo}-${r.semester}`,
    roll_no: r.rollNo,
    student_name: r.studentName,
    programme: r.programme,
    semester: r.semester,
    exam_session: r.examSession,
    subjects: Array.isArray(r.subjects) ? r.subjects : [],
    marks_obtained: r.marksObtained,
    marks_max: r.marksMax,
    sgpa: r.sgpa,
    status: r.status,
    published: r.published ?? true,
  }
}

type ApiCertificate = {
  id: string
  certificateNo: string
  studentName: string
  programme: string
  awardYear: number
  enrollmentNo: string
  division: string
  status: CertificateRecord['status']
  registrarRemarks?: string | null
  issuedOn?: string
}

function toCertificate(c: ApiCertificate): CertificateRecord {
  return {
    id: c.id,
    certificate_no: c.certificateNo,
    student_name: c.studentName,
    programme: c.programme,
    award_year: c.awardYear,
    enrollment_no: c.enrollmentNo,
    division: c.division,
    status: c.status,
    registrar_remarks: c.registrarRemarks ?? null,
    issued_on: (c.issuedOn ?? new Date().toISOString()).slice(0, 10),
  }
}

/* -------------------------------------------------------------- results --- */

export async function listResults(): Promise<ResultRecord[]> {
  const res = await api<{ results: ApiResult[] }>('/api/results')
  if (!res.ok) return []
  return res.data.results.map(toResult)
}

export async function addResult(
  input: Omit<ResultRecord, 'id' | 'published'>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await api<{ created: number; skipped: number }>('/api/results', {
    method: 'POST',
    body: JSON.stringify({
      rollNo: input.roll_no,
      studentName: input.student_name,
      programme: input.programme,
      semester: input.semester,
      examSession: input.exam_session,
      subjects: input.subjects,
      marksObtained: input.marks_obtained,
      marksMax: input.marks_max,
      sgpa: input.sgpa,
      status: input.status,
    }),
  })

  if (!res.ok) return res
  if (res.data.created === 0) {
    return {
      ok: false,
      error: 'A result already exists for that roll number, semester and session.',
    }
  }
  return { ok: true }
}

export async function importResults(
  records: Omit<ResultRecord, 'id' | 'published'>[]
): Promise<number> {
  const res = await api<{ created: number }>('/api/results', {
    method: 'POST',
    body: JSON.stringify({
      rows: records.map((r) => ({
        rollNo: r.roll_no,
        studentName: r.student_name,
        programme: r.programme,
        semester: r.semester,
        examSession: r.exam_session,
        subjects: r.subjects,
        marksObtained: r.marks_obtained,
        marksMax: r.marks_max,
        sgpa: r.sgpa,
        status: r.status,
      })),
    }),
  })
  return res.ok ? res.data.created : 0
}

export async function setResultPublished(id: string, published: boolean): Promise<void> {
  await api(`/api/results/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ published }),
  })
}

export async function deleteResult(id: string): Promise<void> {
  await api(`/api/results/${id}`, { method: 'DELETE' })
}

/* --------------------------------------------------------- certificates --- */

export async function findCertificate(no: string): Promise<CertificateRecord | null> {
  const res = await api<{ certificate: ApiCertificate | null }>(
    `/api/certificates/verify?no=${encodeURIComponent(no.trim().toUpperCase())}`
  )
  if (!res.ok || !res.data.certificate) return null
  return toCertificate(res.data.certificate)
}

export async function listCertificates(): Promise<CertificateRecord[]> {
  const res = await api<{ certificates: ApiCertificate[] }>('/api/certificates')
  if (!res.ok) return []
  return res.data.certificates.map(toCertificate)
}

export async function addCertificate(
  input: Omit<CertificateRecord, 'id'>
): Promise<{ ok: true; id: string; record: CertificateRecord } | { ok: false; error: string }> {
  const res = await api<{ certificate: ApiCertificate }>('/api/certificates', {
    method: 'POST',
    body: JSON.stringify({
      certificateNo: input.certificate_no,
      studentName: input.student_name,
      programme: input.programme,
      awardYear: input.award_year,
      enrollmentNo: input.enrollment_no,
      division: input.division,
      status: input.status,
      registrarRemarks: input.registrar_remarks ?? undefined,
    }),
  })

  if (!res.ok) return res
  const record = toCertificate(res.data.certificate)
  return { ok: true, id: record.id, record }
}

export async function setCertificateStatus(
  id: string,
  status: CertificateRecord['status'],
  remarks?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await api(`/api/certificates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, registrarRemarks: remarks }),
  })
  return res.ok ? { ok: true } : res
}

/**
 * Next number in the register for a year, in the JNU/DEG/<year>/<seq> shape.
 * Derived from the rows already loaded in the admin table, so it never
 * proposes a duplicate of something visible — and the unique constraint on
 * the database is the backstop if two staff generate at the same moment.
 */
export function nextCertificateNo(year: number, existing: CertificateRecord[]): string {
  const prefix = `JNU/DEG/${year}/`
  const highest = existing
    .filter((c) => c.certificate_no.startsWith(prefix))
    .map((c) => Number.parseInt(c.certificate_no.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0)

  return `${prefix}${String((highest > 0 ? highest : 5000) + 1).padStart(6, '0')}`
}

/* ----------------------------------------------------------------- auth --- */

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await api<{ user: Session }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return res.ok ? { ok: true } : res
}

export async function signOut(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' })
}

/**
 * Asks the server who is signed in. The session lives in an httpOnly cookie,
 * so this cannot be answered locally — which is the point.
 */
export async function getSession(): Promise<Session | null> {
  const res = await api<{ user: { id: string; email: string; fullName: string; role: Session['role'] } | null }>(
    '/api/auth/me'
  )
  if (!res.ok || !res.data.user) return null
  const u = res.data.user
  return { id: u.id, email: u.email, full_name: u.fullName, role: u.role }
}

/* ---------------------------------------------------------------- audit --- */

export async function listAudit(): Promise<AuditEntry[]> {
  const res = await api<{
    entries: { at: string; actorEmail: string; action: string; detail: string }[]
  }>('/api/audit')
  if (!res.ok) return []
  return res.data.entries.map((e) => ({
    at: e.at,
    actor: e.actorEmail,
    action: e.action,
    detail: e.detail,
  }))
}

/* -------------------------------------------------------------- enquiry --- */

export async function submitEnquiry(input: {
  name: string
  email: string
  phone?: string
  programme?: string
  message: string
  company?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await api('/api/enquiries', { method: 'POST', body: JSON.stringify(input) })
  return res.ok ? { ok: true } : res
}

/* -------------------------------------------------------------- student --- */

export type StudentProfile = {
  rollNo: string
  enrollmentNo: string
  fullName: string
  fatherName: string
  motherName: string
  dob: string
  programme: string
  photoUrl: string | null
  status: string
}

export type StudentPortal = {
  student: StudentProfile | null
  results: ResultRecord[]
}

export async function studentSignIn(
  rollNo: string,
  dob: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await api<{ student: unknown }>('/api/student/login', {
    method: 'POST',
    body: JSON.stringify({ rollNo, dob }),
  })
  return res.ok ? { ok: true } : res
}

export async function studentSignOut(): Promise<void> {
  await api('/api/student/logout', { method: 'POST' })
}

/**
 * The signed-in student's own record. There is no roll-number parameter by
 * design — the server reads it from the session cookie, so changing a value
 * in the browser cannot fetch somebody else's marksheet.
 */
export async function getStudentPortal(): Promise<StudentPortal> {
  const res = await api<{ student: StudentProfile | null; results?: ApiResult[] }>(
    '/api/student/me'
  )
  if (!res.ok || !res.data.student) return { student: null, results: [] }
  return {
    student: res.data.student,
    results: (res.data.results ?? []).map(toResult),
  }
}

/* --------------------------------------------------- certificate verify --- */

export type VerifyOutcome =
  | { kind: 'found'; row: CertificateRecord }
  | { kind: 'no-certificate' }
  | { kind: 'not-found' }
  | { kind: 'error'; error: string }

/**
 * Verification by roll number + date of birth.
 *
 * A POST, not a GET: the pair is a guessable credential, and a query string
 * would put it in server logs, browser history and Referer headers.
 */
export async function verifyCertificate(rollNo: string, dob: string): Promise<VerifyOutcome> {
  const res = await api<{ certificate: ApiCertificate | null; studentOnRecord?: boolean }>(
    '/api/certificates/verify',
    { method: 'POST', body: JSON.stringify({ rollNo, dob }) }
  )

  if (!res.ok) return { kind: 'error', error: res.error }
  if (res.data.certificate) return { kind: 'found', row: toCertificate(res.data.certificate) }
  if (res.data.studentOnRecord) return { kind: 'no-certificate' }
  return { kind: 'not-found' }
}

/* ---------------------------------------------------------- application --- */

/**
 * Submits the admission form. Takes a FormData rather than a plain object
 * because three documents ride along with it, so this bypasses the JSON
 * `api()` helper above.
 */
export async function submitApplication(
  form: FormData
): Promise<{ ok: true; applicationNo: string | null } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/applications/', {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
      // No Content-Type header: the browser must set it with the multipart
      // boundary, and setting it by hand breaks the upload.
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: body?.error ?? `Submission failed (${res.status}).` }
    return { ok: true, applicationNo: body?.applicationNo ?? null }
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' }
  }
}
