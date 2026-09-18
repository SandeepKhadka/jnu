import { db } from '@/lib/db'
import { audit, requireRole } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/certificates/[id]/print — { mode: 'stationery' | 'alignment' }
 *
 * REGISTRAR ONLY. Called by the admin screen immediately before it prints a
 * degree onto the university's certificate stationery, and the print does not
 * happen unless this succeeds. That makes the audit log a record of every
 * blank the university has consumed: a stationery count that does not match
 * the log is how a missing or misused blank is noticed.
 *
 * Only a VERIFIED certificate can be printed. A revoked or withheld degree on
 * genuine stationery would be a valid-looking document the register itself
 * disowns.
 *
 * An alignment test prints no candidate details, so it is allowed for any
 * status and logged separately.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('registrar')
    const { id } = await ctx.params
    const body = await readJson<{ mode?: string }>(req)
    const mode = body?.mode === 'alignment' ? 'alignment' : 'stationery'

    const cert = await db.certificate.findUnique({
      where: { id },
      select: { certificateNo: true, studentName: true, status: true },
    })
    if (!cert) return fail('No such certificate.', 404)

    if (mode === 'stationery' && cert.status !== 'VERIFIED') {
      return fail(
        `${cert.certificateNo} is ${cert.status.toLowerCase()} and cannot be printed on stationery.`,
        409
      )
    }

    await audit(
      user,
      mode === 'stationery' ? 'certificate.print' : 'certificate.alignment-test',
      `${cert.certificateNo} — ${cert.studentName}`
    )
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
