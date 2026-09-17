import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { ok, fail, handleError, readJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/enquiries — staff only. */
export async function GET() {
  try {
    await requireStaff()
    const rows = await db.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return ok({ enquiries: rows })
  } catch (e) {
    return handleError(e)
  }
}

/** POST /api/enquiries — public contact form. */
export async function POST(req: Request) {
  try {
    const body = await readJson<{
      name?: string
      email?: string
      phone?: string
      programme?: string
      message?: string
      company?: string
    }>(req)
    if (!body) return fail('Invalid request body.')

    // Honeypot: real users never see this field. Accept and drop silently —
    // telling a bot it was detected only helps whoever wrote it adapt.
    if (body.company) return ok({ ok: true }, 201)

    if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
      return fail('Name, email and message are required.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      return fail('Enter a valid email address.')
    }
    if (body.message.length > 4000) return fail('That message is too long.')

    await db.enquiry.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone?.trim() || null,
        programme: body.programme?.trim() || null,
        message: body.message.trim(),
      },
    })

    return ok({ ok: true }, 201)
  } catch (e) {
    return handleError(e)
  }
}
