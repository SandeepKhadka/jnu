import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { formatSerial, parseSerial } from '@/lib/marksheet'
import { clientIp, rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/certificates/by-serial?sn=JNU-DEG-XXXX-XXXX-XXXX — public.
 *
 * What the QR code printed on a degree resolves to. Returns the register
 * entry — the same fields the roll-number-and-date-of-birth check returns,
 * and nothing more — including REVOKED or WITHHELD, which the page shows
 * prominently. A degree printed from this system that has since been revoked
 * must say so to whoever scans it.
 */
export async function GET(req: Request) {
  try {
    const limit = await rateLimit('certificate-serial', clientIp(req), 20, 15 * 60)
    if (!limit.allowed) {
      return fail(
        `Too many verification attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429
      )
    }

    const token = parseSerial(new URL(req.url).searchParams.get('sn') ?? '')
    if (!token) return fail('Enter the serial number exactly as printed on the certificate.')

    const row = await db.certificate.findUnique({
      where: { verifyToken: token },
      select: {
        certificateNo: true,
        studentName: true,
        programme: true,
        awardYear: true,
        enrollmentNo: true,
        division: true,
        status: true,
        registrarRemarks: true,
        issuedOn: true,
      },
    })
    if (!row) return ok({ certificate: null })

    return ok({
      certificate: {
        ...row,
        issuedOn: row.issuedOn.toISOString(),
        serial: formatSerial(token, 'DEG'),
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
