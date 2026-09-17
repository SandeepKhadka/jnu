import { db } from '@/lib/db'
import { requireStaff, audit } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

const STATUSES = ['VERIFIED', 'REVOKED', 'WITHHELD']

/**
 * PATCH /api/certificates/:id — staff only. Revoke, withhold or reinstate.
 *
 * Revocation requires a reason, which is stored and shown publicly on the
 * verification page. A credential withdrawn silently would still read as valid
 * to anyone checking it, which defeats the point of keeping a register.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireStaff()
    const { id } = await ctx.params
    const body = await readJson<{ status?: string; registrarRemarks?: string }>(req)

    const status = body?.status?.toUpperCase()
    if (!status || !STATUSES.includes(status)) {
      return fail(`Status must be one of ${STATUSES.join(', ')}.`)
    }
    if (status === 'REVOKED' && !body?.registrarRemarks?.trim()) {
      return fail('A reason is required when revoking a certificate.')
    }

    const existing = await db.certificate.findUnique({ where: { id } })
    if (!existing) return fail('No such certificate.', 404)

    const row = await db.certificate.update({
      where: { id },
      data: {
        status,
        registrarRemarks: body?.registrarRemarks?.trim() || null,
      },
    })

    const reason = body?.registrarRemarks?.trim()
    await audit(
      user,
      `certificate.${status.toLowerCase()}`,
      reason ? `${row.certificateNo} — ${reason}` : row.certificateNo
    )
    return ok({ certificate: row })
  } catch (e) {
    return handleError(e)
  }
}
