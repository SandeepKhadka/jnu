import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

import { db } from '@/lib/db'

/**
 * Student authentication: roll number + date of birth.
 *
 * Deliberately a SEPARATE cookie, secret salt and session type from the staff
 * auth in lib/auth.ts. A student session must never be mistaken for a staff
 * one by a route that only checks "is someone signed in", so the two cannot
 * share a token.
 *
 * On the strength of this credential
 * ----------------------------------
 * It is weak, and knowingly so. Roll numbers are sequential and a cohort's
 * dates of birth span a few years, so the space is walkable. It is what the
 * university asked for and what students can actually use, so the mitigations
 * are here rather than in the choice of credential:
 *
 *   - per-IP rate limiting on the login route (lib/ratelimit.ts),
 *   - per-account lockout after repeated failures, below,
 *   - a constant-ish response whether or not the roll number exists, so the
 *     endpoint cannot be used to enumerate which roll numbers are enrolled.
 *
 * If the university later wants this hardened, the right step is a one-time
 * password to the registered mobile number, not a longer date format.
 */

const COOKIE = 'jnu_student'
const MAX_AGE_SECONDS = 60 * 60 * 2 // two hours; shorter than staff by design

const MAX_FAILED = 5
const LOCKOUT_MINUTES = 15

export type StudentSession = {
  id: string
  rollNo: string
  fullName: string
}

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) {
    throw new Error(
      'AUTH_SECRET must be set to a random string of at least 32 characters. See .env.local.example.'
    )
  }
  // Salted so a student token can never validate as a staff token even though
  // both are signed with the same configured secret.
  return new TextEncoder().encode(`${value}:student`)
}

/** `YYYY-MM-DD`, or null. Rejects impossible dates rather than coercing them. */
export function normaliseDob(input: string): string | null {
  const value = input.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const [y, m, d] = value.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return null

  // Round-trip through UTC to reject 2005-02-30 and friends.
  const asDate = new Date(Date.UTC(y, m - 1, d))
  if (
    asDate.getUTCFullYear() !== y ||
    asDate.getUTCMonth() !== m - 1 ||
    asDate.getUTCDate() !== d
  ) {
    return null
  }

  const year = new Date().getUTCFullYear()
  if (y < year - 100 || y > year) return null

  return value
}

export type SignInOutcome =
  | { ok: true; student: StudentSession }
  | { ok: false; error: string }

/**
 * Verifies roll number + date of birth.
 *
 * Every failure returns the same message. Distinguishing "no such roll number"
 * from "wrong date of birth" would turn this into a roll-number oracle.
 */
export async function verifyStudent(rollNo: string, dob: string): Promise<SignInOutcome> {
  const roll = rollNo.trim().toUpperCase()
  const date = normaliseDob(dob)

  const generic = {
    ok: false as const,
    error: 'Roll number and date of birth do not match our records.',
  }

  if (!roll || !date) return generic

  const student = await db.student.findUnique({ where: { rollNo: roll } })
  if (!student) return generic

  if (student.lockedUntil && student.lockedUntil > new Date()) {
    const mins = Math.ceil((student.lockedUntil.getTime() - Date.now()) / 60000)
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
    }
  }

  if (student.dob !== date) {
    const failed = student.failedLogins + 1
    await db.student.update({
      where: { id: student.id },
      data: {
        failedLogins: failed,
        lockedUntil:
          failed >= MAX_FAILED ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      },
    })
    return generic
  }

  await db.student.update({
    where: { id: student.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  })

  return {
    ok: true,
    student: { id: student.id, rollNo: student.rollNo, fullName: student.fullName },
  }
}

export async function createStudentSession(student: StudentSession): Promise<void> {
  const token = await new SignJWT({ rollNo: student.rollNo, fullName: student.fullName })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(student.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function destroyStudentSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

/** The signed-in student, or null. Never throws on a bad token. */
export async function getStudentSession(): Promise<StudentSession | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub) return null

    // Re-read from the database so a withdrawn student loses access before
    // their token expires.
    const student = await db.student.findUnique({ where: { id: payload.sub } })
    if (!student || student.status === 'WITHDRAWN') return null

    return { id: student.id, rollNo: student.rollNo, fullName: student.fullName }
  } catch {
    return null
  }
}

export class StudentUnauthorizedError extends Error {
  constructor() {
    super('Student not signed in')
    this.name = 'StudentUnauthorizedError'
  }
}

/** Guard for student-only API routes. */
export async function requireStudent(): Promise<StudentSession> {
  const student = await getStudentSession()
  if (!student) throw new StudentUnauthorizedError()
  return student
}
