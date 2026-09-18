import 'server-only'

import { InputError, s } from '@/lib/admin-route'
import { normaliseDob } from '@/lib/student-auth'
import { isEmail, isPincode, normaliseMobile } from '@/lib/validate'
import { STUDENT_STATUSES } from '@/lib/student-constants'

/**
 * Validates a student record entered by staff.
 *
 * The roll number and date of birth are the student's login credential and
 * what certificate verification checks, so both are normalised to exactly one
 * form: roll numbers upper-cased, dates as YYYY-MM-DD. A record that differs
 * only in case or date format would lock the student out of their own result.
 */
export function studentInput(input: Record<string, unknown>) {
  const rollNo = s(input.rollNo, 24).toUpperCase()
  const enrollmentNo = s(input.enrollmentNo, 40).toUpperCase()
  const fullName = s(input.fullName, 120)
  const fatherName = s(input.fatherName, 120)
  const motherName = s(input.motherName, 120)
  const programme = s(input.programme, 160)
  const dob = normaliseDob(s(input.dob, 10))
  const status = (STUDENT_STATUSES as readonly string[]).includes(s(input.status, 20))
    ? s(input.status, 20)
    : 'ACTIVE'

  if (!rollNo) throw new InputError('A roll number is required.')
  if (!/^[A-Z0-9/-]{3,24}$/.test(rollNo)) throw new InputError('Roll numbers may use letters, digits, / and -.')
  if (!enrollmentNo) throw new InputError('An enrollment number is required.')
  if (!fullName) throw new InputError("The student's name is required.")
  if (!fatherName) throw new InputError("The father's name is required.")
  if (!motherName) throw new InputError("The mother's name is required.")
  if (!dob) throw new InputError('Enter a valid date of birth (it is half of the student login).')
  if (!programme) throw new InputError('A programme is required.')

  const mobileRaw = s(input.mobile, 20)
  const mobile = mobileRaw ? normaliseMobile(mobileRaw) : null
  if (mobileRaw && !mobile) throw new InputError('Enter a valid 10-digit mobile number.')

  const email = s(input.email, 160)
  if (email && !isEmail(email)) throw new InputError('Enter a valid email address.')

  const pincode = s(input.pincode, 6)
  if (pincode && !isPincode(pincode)) throw new InputError('Enter a valid 6-digit PIN code.')

  return {
    rollNo,
    enrollmentNo,
    fullName,
    fatherName,
    motherName,
    dob,
    programme,
    status,
    mobile,
    email: email || null,
    addressLine: s(input.addressLine, 500) || null,
    district: s(input.district, 80) || null,
    state: s(input.state, 80) || null,
    pincode: pincode || null,
  }
}

/** Splits one CSV line, honouring "quoted, fields". */
export function csvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      out.push(cur.trim())
      cur = ''
    } else cur += c
  }
  out.push(cur.trim())
  return out
}
