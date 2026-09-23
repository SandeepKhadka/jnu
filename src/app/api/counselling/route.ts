import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { requirePermission } from '@/lib/admin-route'
import { clientIp, rateLimit } from '@/lib/ratelimit'
import { removeUpload, storeUpload, type UploadKind } from '@/lib/storage'
import { isEmail, isIndianState, normaliseMobile } from '@/lib/validate'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25
const STATUSES = ['NEW', 'CONTACTED', 'CLOSED']

class ValidationError extends Error {}

function reject(message: string): never {
  throw new ValidationError(message)
}

/** GET /api/counselling?q=&status=&page= — the counselling queue, newest first. */
export async function GET(req: Request) {
  try {
    await requirePermission('counselling.manage')
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    const status = url.searchParams.get('status') ?? ''
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)

    const where = {
      ...(status && STATUSES.includes(status) ? { status } : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q.toUpperCase() } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { counsellorName: { contains: q } },
              { mobile: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      db.counselling.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.counselling.count({ where }),
    ])

    return ok({ rows, total, page, pageSize: PAGE_SIZE })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * POST /api/counselling — the public "Education Consultancy Online" form.
 *
 * multipart/form-data, because a photograph may come with it. Files go
 * through lib/storage, which sniffs magic numbers and writes outside
 * public/, and anything already stored is removed if a later field fails —
 * a form rejected on its last check must not leave someone's identity
 * document sitting on disk.
 *
 * Both documents are OPTIONAL. This is a request for a call back, not an
 * admission; under the DPDP Act 2023 the defensible amount of personal data
 * is the amount the purpose needs, and a counsellor can ring someone without
 * holding their Aadhaar. Identity is established later, by Application.
 */
export async function POST(req: Request) {
  const stored: string[] = []

  try {
    const limit = await rateLimit('counselling', clientIp(req), 5, 60 * 60)
    if (!limit.allowed) {
      return fail('Too many counselling requests from this connection. Please try again later.', 429)
    }

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      reject('Could not read the submitted form.')
    }

    const text = (name: string) => (form.get(name) as string | null)?.trim() ?? ''

    // Honeypot — real users never see this field. Accept and drop silently;
    // telling a bot it was spotted only helps whoever wrote it adapt.
    if (text('company')) return ok({ ok: true, reference: null }, 201)

    for (const field of ['counsellorName', 'firstName', 'lastName', 'state', 'district', 'city'] as const) {
      if (!text(field)) reject('Please complete every required field.')
    }

    const email = text('email')
    if (!isEmail(email)) reject('Enter a valid email address.')

    const mobile = normaliseMobile(text('mobile')) ?? reject('Enter a valid 10-digit mobile number.')

    if (!isIndianState(text('state'))) reject('Select a state or union territory.')

    /* ---- optional documents ---- */

    async function attach(field: string, kind: UploadKind, label: string): Promise<string | null> {
      const file = form.get(field)
      if (!(file instanceof File) || file.size === 0) return null
      const res = await storeUpload(file, kind)
      if (!res.ok) reject(res.error)
      stored.push(res.id)
      return res.id
    }

    const photoId = await attach('photo', 'PHOTO', 'passport photograph')
    const aadhaarId = await attach('aadhaar', 'AADHAAR', 'Aadhaar card')

    /* ---- reference number ---- */

    const prefix = `JNU/CNS/${new Date().getFullYear()}/`
    const latest = await db.counselling.findFirst({
      where: { reference: { startsWith: prefix } },
      orderBy: { reference: 'desc' },
      select: { reference: true },
    })
    const seq = latest ? Number.parseInt(latest.reference.slice(prefix.length), 10) + 1 : 1
    const reference = `${prefix}${String(Number.isFinite(seq) ? seq : 1).padStart(6, '0')}`

    const row = await db.counselling.create({
      data: {
        reference,
        counsellorName: text('counsellorName').slice(0, 160),
        firstName: text('firstName').slice(0, 80),
        lastName: text('lastName').slice(0, 80),
        email,
        mobile,
        state: text('state'),
        district: text('district').slice(0, 80),
        city: text('city').slice(0, 80),
        photoId,
        aadhaarId,
      },
    })

    return ok({ ok: true, reference: row.reference }, 201)
  } catch (e) {
    // Never leave uploaded personal data behind for a request that failed.
    await Promise.all(stored.map((id) => removeUpload(id)))
    if (e instanceof ValidationError) return fail(e.message)
    return handleError(e)
  }
}
