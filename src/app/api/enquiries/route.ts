import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { requirePermission } from '@/lib/admin-route'
import { ok, fail, handleError, readJson } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/enquiries — staff only. */
const PAGE_SIZE = 25

/** GET /api/enquiries?q=&handled=&page= — contact-form submissions, newest first. */
export async function GET(req: Request) {
  try {
    await requirePermission('enquiries.manage')
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const handled = url.searchParams.get('handled')
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)

    const where = {
      ...(handled === 'true' || handled === 'false' ? { handled: handled === 'true' } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { message: { contains: q } },
            ],
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      db.enquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.enquiry.count({ where }),
    ])
    return ok({ enquiries: rows, total, pageSize: PAGE_SIZE })
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
