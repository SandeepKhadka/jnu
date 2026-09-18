import { NextResponse } from 'next/server'
import { ForbiddenError, PasswordChangeRequiredError, UnauthorizedError } from '@/lib/auth'
import { StudentUnauthorizedError } from '@/lib/student-auth'
import { InputError } from '@/lib/admin-route'

/**
 * Shared response helpers so every route reports errors the same way and a
 * thrown UnauthorizedError never leaks a stack trace to the client.
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleError(e: unknown) {
  if (e instanceof InputError) return fail(e.message, 400)
  if (e instanceof UnauthorizedError) return fail('Not signed in.', 401)
  if (e instanceof StudentUnauthorizedError) return fail('Not signed in.', 401)
  if (e instanceof ForbiddenError) return fail('Your role does not permit this action.', 403)
  if (e instanceof PasswordChangeRequiredError) {
    return fail('Set a new password before continuing.', 403)
  }

  // Prisma unique-constraint violation.
  if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
    return fail('That record already exists.', 409)
  }

  console.error(e)
  return fail('Something went wrong. Please try again.', 500)
}

/** Parses a JSON body, returning null rather than throwing on bad input. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}
