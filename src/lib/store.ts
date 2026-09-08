/**
 * Local-first data layer.
 *
 * Default mode is LOCAL: seed data from content/seed.ts, with admin edits
 * layered on top in localStorage. Nothing to configure — clone, install, run.
 * This is what makes the project demonstrable on any machine, offline.
 *
 * If Supabase env vars are set, `getMode()` reports 'supabase' and the README
 * explains how to point the same call sites at the real database. The function
 * signatures here are deliberately async so that swap needs no component
 * changes.
 *
 * On persistence: localStorage is per-browser. Data entered in the admin panel
 * is visible to the results page in the SAME browser, which is exactly what a
 * project demo needs. It does not sync across devices — for that you need the
 * Supabase path.
 */

import {
  seedResults,
  seedCertificates,
  demoStaff,
  type ResultRecord,
  type CertificateRecord,
} from '@/content/seed'

const K = {
  results: 'jnu.results.v1',
  certificates: 'jnu.certificates.v1',
  session: 'jnu.session.v1',
  audit: 'jnu.audit.v1',
} as const

export type Session = {
  email: string
  full_name: string
  role: 'registrar' | 'exam_cell' | 'editor'
  signed_in_at: string
}

export type AuditEntry = {
  at: string
  actor: string
  action: string
  detail: string
}

export function getMode(): 'local' | 'supabase' {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && !url.includes('your-project') ? 'supabase' : 'local'
}

/* ------------------------------------------------------------ internals --- */

function canStore(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const probe = '__jnu_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    // Private windows and blocked-site-data settings both throw here.
    return false
  }
}

function read<T>(key: string, fallback: T): T {
  if (!canStore()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  if (!canStore()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded, or storage blocked. Nothing useful to do; the UI reads
    // back through the same accessor, so it will simply show unchanged data.
  }
}

function uid(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function logAudit(action: string, detail: string): void {
  const session = getSession()
  const entry: AuditEntry = {
    at: new Date().toISOString(),
    actor: session?.email ?? 'unknown',
    action,
    detail,
  }
  const log = read<AuditEntry[]>(K.audit, [])
  // Newest first, capped so the demo cannot fill the storage quota.
  write(K.audit, [entry, ...log].slice(0, 200))
}

export function listAudit(): AuditEntry[] {
  return read<AuditEntry[]>(K.audit, [])
}

/* -------------------------------------------------------------- results --- */

function allResults(): ResultRecord[] {
  return read<ResultRecord[]>(K.results, seedResults)
}

function saveResults(rows: ResultRecord[]): void {
  write(K.results, rows)
}

export async function listResults(): Promise<ResultRecord[]> {
  return [...allResults()].sort((a, b) => a.roll_no.localeCompare(b.roll_no))
}

/**
 * Public lookup. Only published rows are ever returned, so an unpublished
 * result is indistinguishable from a roll number that does not exist — which
 * also stops anyone enumerating enrolled students.
 */
export async function findPublishedResults(rollNo: string): Promise<ResultRecord[]> {
  const needle = rollNo.trim().toUpperCase()
  if (!needle) return []
  return allResults()
    .filter((r) => r.published && r.roll_no.toUpperCase() === needle)
    .sort((a, b) => b.semester.localeCompare(a.semester))
}

export async function addResult(
  input: Omit<ResultRecord, 'id' | 'published' | 'published_at'>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = allResults()
  const roll = input.roll_no.trim().toUpperCase()

  const clash = rows.some(
    (r) =>
      r.roll_no.toUpperCase() === roll &&
      r.semester === input.semester &&
      r.exam_session === input.exam_session
  )
  if (clash) {
    return {
      ok: false,
      error: 'A result already exists for that roll number, semester and session.',
    }
  }

  const row: ResultRecord = {
    ...input,
    roll_no: roll,
    id: uid('r'),
    published: false, // never auto-publish
  }
  saveResults([row, ...rows])
  logAudit('result.create', `${roll} — ${input.semester} (${input.exam_session})`)
  return { ok: true }
}

export async function setResultPublished(id: string, published: boolean): Promise<void> {
  const rows = allResults()
  const row = rows.find((r) => r.id === id)
  saveResults(
    rows.map((r) =>
      r.id === id
        ? { ...r, published, published_at: published ? new Date().toISOString() : undefined }
        : r
    )
  )
  if (row) {
    logAudit(published ? 'result.publish' : 'result.unpublish', `${row.roll_no} — ${row.semester}`)
  }
}

export async function deleteResult(id: string): Promise<void> {
  const rows = allResults()
  const row = rows.find((r) => r.id === id)
  saveResults(rows.filter((r) => r.id !== id))
  if (row) logAudit('result.delete', `${row.roll_no} — ${row.semester}`)
}

/** Bulk CSV import. Rows arrive unpublished so a bad file can be corrected. */
export async function importResults(
  records: Omit<ResultRecord, 'id' | 'published' | 'published_at'>[]
): Promise<number> {
  const rows = allResults()
  const added: ResultRecord[] = records.map((rec) => ({
    ...rec,
    roll_no: rec.roll_no.trim().toUpperCase(),
    id: uid('r'),
    published: false,
  }))
  saveResults([...added, ...rows])
  logAudit('result.import', `${added.length} rows imported as unpublished`)
  return added.length
}

/* --------------------------------------------------------- certificates --- */

function allCertificates(): CertificateRecord[] {
  return read<CertificateRecord[]>(K.certificates, seedCertificates)
}

function saveCertificates(rows: CertificateRecord[]): void {
  write(K.certificates, rows)
}

export async function listCertificates(): Promise<CertificateRecord[]> {
  return [...allCertificates()].sort((a, b) => b.issued_on.localeCompare(a.issued_on))
}

export async function findCertificate(no: string): Promise<CertificateRecord | null> {
  const needle = no.trim().toUpperCase()
  if (!needle) return null
  return (
    allCertificates().find((c) => c.certificate_no.toUpperCase() === needle) ?? null
  )
}

export async function findCertificateById(id: string): Promise<CertificateRecord | null> {
  return allCertificates().find((c) => c.id === id) ?? null
}

export async function addCertificate(
  input: Omit<CertificateRecord, 'id'>
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const rows = allCertificates()
  const no = input.certificate_no.trim().toUpperCase()

  if (rows.some((c) => c.certificate_no.toUpperCase() === no)) {
    return { ok: false, error: 'That certificate number is already on record.' }
  }

  const row: CertificateRecord = { ...input, certificate_no: no, id: uid('c') }
  saveCertificates([row, ...rows])
  logAudit('certificate.create', `${no} — ${input.student_name}`)
  return { ok: true, id: row.id }
}

export async function setCertificateStatus(
  id: string,
  status: CertificateRecord['status'],
  remarks?: string
): Promise<void> {
  const rows = allCertificates()
  const row = rows.find((c) => c.id === id)
  saveCertificates(
    rows.map((c) =>
      c.id === id ? { ...c, status, ...(remarks !== undefined ? { registrar_remarks: remarks } : {}) } : c
    )
  )
  if (row) logAudit(`certificate.${status.toLowerCase()}`, `${row.certificate_no} — ${remarks ?? ''}`)
}

/**
 * Next certificate number in the register, in the JNU/DEG/<year>/<seq> shape.
 * Sequence continues from the highest existing number for that year so the
 * generator never proposes a duplicate.
 */
export function nextCertificateNo(year: number): string {
  const prefix = `JNU/DEG/${year}/`
  const highest = allCertificates()
    .filter((c) => c.certificate_no.startsWith(prefix))
    .map((c) => Number.parseInt(c.certificate_no.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0)

  const next = (highest > 0 ? highest : 5000) + 1
  return `${prefix}${String(next).padStart(6, '0')}`
}

/* ----------------------------------------------------------------- auth --- */

export function getSession(): Session | null {
  return read<Session | null>(K.session, null)
}

/**
 * Demo sign-in for local mode.
 *
 * Checked in the browser against content/seed.ts, so it is NOT security —
 * the credentials are readable in the bundle. Acceptable for an academic
 * project demo and nowhere else; the README says so, and the admin panel
 * shows a banner saying so. Configure Supabase for a real deployment.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const match = demoStaff.find(
    (s) => s.email.toLowerCase() === email.trim().toLowerCase() && s.password === password
  )

  if (!match) {
    // Generic on purpose: never reveal whether the account exists.
    return { ok: false, error: 'Incorrect email or password.' }
  }

  const session: Session = {
    email: match.email,
    full_name: match.full_name,
    role: match.role,
    signed_in_at: new Date().toISOString(),
  }
  write(K.session, session)
  logAudit('auth.signin', match.email)
  return { ok: true }
}

export async function signOut(): Promise<void> {
  const s = getSession()
  if (s) logAudit('auth.signout', s.email)
  if (canStore()) {
    try {
      window.localStorage.removeItem(K.session)
    } catch {
      /* nothing useful to do */
    }
  }
}

/* ---------------------------------------------------------------- reset --- */

/** Clears the localStorage overlay, returning every table to seed state. */
export function resetDemoData(): void {
  if (!canStore()) return
  try {
    window.localStorage.removeItem(K.results)
    window.localStorage.removeItem(K.certificates)
    window.localStorage.removeItem(K.audit)
  } catch {
    /* nothing useful to do */
  }
}

/** True when the browser will not persist anything (private window, etc.). */
export function storageAvailable(): boolean {
  return canStore()
}

export type { ResultRecord, CertificateRecord }
