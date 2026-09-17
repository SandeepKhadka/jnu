import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/certificates/verify?no=JNU/DEG/2024/004512 — public.
 *
 * Open by design: confirming a credential on request is the purpose of the
 * register, and it is in the graduate's interest. Only the fields the
 * verification page displays are selected.
 */
export async function GET(req: Request) {
  try {
    const no = new URL(req.url).searchParams.get('no')?.trim().toUpperCase()
    if (!no) return fail('A certificate number is required.')
    if (no.length > 40) return fail('That certificate number is too long.')

    const row = await db.certificate.findUnique({
      where: { certificateNo: no },
      select: {
        certificateNo: true,
        studentName: true,
        programme: true,
        awardYear: true,
        enrollmentNo: true,
        division: true,
        status: true,
        registrarRemarks: true,
      },
    })

    return ok({ certificate: row })
  } catch (e) {
    return handleError(e)
  }
}
