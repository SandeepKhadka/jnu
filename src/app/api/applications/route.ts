import { db } from '@/lib/db'
import { ok, fail, handleError } from '@/lib/api'
import { requireStaff } from '@/lib/auth'
import { requirePermission } from '@/lib/admin-route'
import { clientIp, rateLimit } from '@/lib/ratelimit'
import { normaliseDob } from '@/lib/student-auth'
import { removeUpload, storeUpload, type UploadKind } from '@/lib/storage'
import { isEmail, isIndianState, isPincode, normaliseMobile } from '@/lib/validate'
import { getAllProgrammeNames } from '@/lib/content'

export const dynamic = 'force-dynamic'

/** GET /api/applications — staff only. */
export async function GET() {
  try {
    await requirePermission('applications.manage')
    const rows = await db.application.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        applicationNo: true,
        fullName: true,
        fatherName: true,
        motherName: true,
        dob: true,
        mobile: true,
        email: true,
        state: true,
        district: true,
        address: true,
        pincode: true,
        programme: true,
        qualification: true,
        qualificationBoard: true,
        qualificationYear: true,
        qualificationPct: true,
        aadhaarLast4: true,
        photoId: true,
        aadhaarId: true,
        qualificationDocId: true,
        status: true,
        remarks: true,
        createdAt: true,
      },
    })
    return ok({ applications: rows })
  } catch (e) {
    return handleError(e)
  }
}

/**
 * Thrown for any applicant-facing rejection.
 *
 * Every failure has to unwind through one place, because by the time the last
 * field is validated an Aadhaar scan may already be on disk. A bare
 * `return fail(...)` would leave it there — accumulating exactly the personal
 * data we should not be keeping, for an application that was never created.
 */
class ValidationError extends Error {}

function reject(message: string): never {
  throw new ValidationError(message)
}

const REQUIRED_TEXT = [
  'fullName',
  'fatherName',
  'motherName',
  'mobile',
  'email',
  'state',
  'district',
  'address',
  'pincode',
  'programme',
  'qualification',
] as const

/**
 * POST /api/applications — the public admission form.
 *
 * multipart/form-data rather than JSON, because three documents come with it.
 * Files go through lib/storage, which sniffs magic numbers and writes outside
 * public/ — an Aadhaar scan under public/ would be published at a guessable
 * URL the instant it was written.
 *
 * On failure, any file already stored is removed before returning. Otherwise a
 * form rejected on its last field would leave orphaned Aadhaar scans on disk,
 * which is exactly the personal data we should not be accumulating.
 */
export async function POST(req: Request) {
  const stored: string[] = []

  try {
    const limit = await rateLimit('application', clientIp(req), 5, 60 * 60)
    if (!limit.allowed) {
      return fail('Too many applications from this connection. Please try again later.', 429)
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
    if (text('company')) return ok({ ok: true, applicationNo: null }, 201)

    for (const field of REQUIRED_TEXT) {
      if (!text(field)) reject('Please complete every required field.')
    }

    const dob = normaliseDob(text('dob'))
    if (!dob) reject('Enter a valid date of birth.')

    const email = text('email')
    if (!isEmail(email)) reject('Enter a valid email address.')

    const mobile = normaliseMobile(text('mobile')) ?? reject('Enter a valid 10-digit mobile number.')

    const pincode = text('pincode')
    if (!isPincode(pincode)) reject('Enter a valid 6-digit PIN code.')

    if (!isIndianState(text('state'))) reject('Select a state or union territory.')

    const programme = text('programme')
    if (!(await getAllProgrammeNames()).includes(programme)) {
      reject('Select a programme from the list.')
    }

    // Aadhaar: last four digits only, never the full number. UIDAI requires
    // masking for entities that are not authorised authentication agencies,
    // and under the DPDP Act 2023 holding more than is needed is a liability,
    // not an asset. Four digits is enough for the office to match an
    // applicant to the document they uploaded, which is all it is for.
    const aadhaarLast4Raw = text('aadhaarLast4').replace(/\D/g, '')
    if (aadhaarLast4Raw && !/^\d{4}$/.test(aadhaarLast4Raw)) {
      reject('Enter only the last four digits of the Aadhaar number.')
    }

    const year = Number.parseInt(text('qualificationYear'), 10)
    const pct = Number.parseFloat(text('qualificationPct'))
    const thisYear = new Date().getFullYear()
    if (text('qualificationYear') && (!Number.isFinite(year) || year < 1950 || year > thisYear)) {
      reject('Enter a valid year of passing.')
    }
    if (text('qualificationPct') && (!Number.isFinite(pct) || pct < 0 || pct > 100)) {
      reject('Enter a percentage between 0 and 100.')
    }

    /* ---- documents ---- */

    async function attach(
      field: string,
      kind: UploadKind,
      label: string,
      required: boolean
    ): Promise<string | null> {
      const file = form.get(field)
      if (!(file instanceof File) || file.size === 0) {
        if (required) reject(`Please attach your ${label}.`)
        return null
      }
      const res = await storeUpload(file, kind)
      if (!res.ok) reject(res.error)
      stored.push(res.id)
      return res.id
    }

    const photoId = await attach('photo', 'PHOTO', 'passport photograph', true)
    const aadhaarId = await attach('aadhaar', 'AADHAAR', 'Aadhaar card', true)
    const qualificationDocId = await attach(
      'qualificationDoc',
      'QUALIFICATION',
      'qualification certificate',
      false
    )

    /* ---- application number ---- */

    const prefix = `JNU/APP/${thisYear}/`
    const latest = await db.application.findFirst({
      where: { applicationNo: { startsWith: prefix } },
      orderBy: { applicationNo: 'desc' },
      select: { applicationNo: true },
    })
    const seq = latest ? Number.parseInt(latest.applicationNo.slice(prefix.length), 10) + 1 : 1
    const applicationNo = `${prefix}${String(Number.isFinite(seq) ? seq : 1).padStart(6, '0')}`

    const row = await db.application.create({
      data: {
        applicationNo,
        fullName: text('fullName').slice(0, 120),
        fatherName: text('fatherName').slice(0, 120),
        motherName: text('motherName').slice(0, 120),
        dob,
        mobile,
        email,
        state: text('state'),
        district: text('district').slice(0, 80),
        address: text('address').slice(0, 500),
        pincode,
        programme,
        qualification: text('qualification').slice(0, 120),
        qualificationBoard: text('qualificationBoard').slice(0, 120) || null,
        qualificationYear: Number.isFinite(year) ? year : null,
        qualificationPct: Number.isFinite(pct) ? pct : null,
        aadhaarLast4: aadhaarLast4Raw || null,
        photoId,
        aadhaarId,
        qualificationDocId,
      },
      select: { applicationNo: true },
    })

    return ok({ ok: true, applicationNo: row.applicationNo }, 201)
  } catch (e) {
    // Never leave uploaded personal data behind for a request that failed.
    await Promise.all(stored.map((id) => removeUpload(id)))
    if (e instanceof ValidationError) return fail(e.message)
    return handleError(e)
  }
}
