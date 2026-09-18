import 'server-only'

import { randomInt } from 'node:crypto'

import { db } from '@/lib/db'
import { SERIAL_ALPHABET, SERIAL_LENGTH } from '@/lib/marksheet'

/**
 * 12 characters of base32 is 60 bits. With the verify endpoint rate limited,
 * that is far beyond walking; the point is that a serial off one sheet says
 * nothing about the serial on the next.
 */
export function newVerifyToken(): string {
  let out = ''
  for (let i = 0; i < SERIAL_LENGTH; i++) out += SERIAL_ALPHABET[randomInt(SERIAL_ALPHABET.length)]
  return out
}

/**
 * Makes sure each of these published results has a serial, issuing one where
 * it is missing, and returns id → token.
 *
 * Results published before serials existed, and rows imported straight into
 * the database, have none. Issuing lazily on first read means every sheet a
 * student can print carries a serial, without a backfill job someone has to
 * remember to run. The `verifyToken: null` guard on the update means two
 * concurrent reads cannot give one result two different serials.
 */
export async function ensureVerifyTokens(
  rows: { id: string; verifyToken: string | null }[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>()

  for (const r of rows) {
    if (r.verifyToken) {
      out.set(r.id, r.verifyToken)
      continue
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const token = newVerifyToken()
      try {
        const res = await db.result.updateMany({
          where: { id: r.id, verifyToken: null },
          data: { verifyToken: token },
        })
        if (res.count === 1) {
          out.set(r.id, token)
        } else {
          // Someone else issued it first — use theirs.
          const current = await db.result.findUnique({
            where: { id: r.id },
            select: { verifyToken: true },
          })
          if (current?.verifyToken) out.set(r.id, current.verifyToken)
        }
        break
      } catch {
        // Unique collision on a 60-bit random value: vanishingly unlikely,
        // but retrying is cheaper than reasoning about it.
      }
    }
  }

  return out
}

/**
 * Same as ensureVerifyTokens, for the certificate register. Certificates
 * issued before serials existed get one the first time staff load the
 * register, so every degree printed from here on carries a checkable QR.
 */
export async function ensureCertificateTokens(
  rows: { id: string; verifyToken: string | null }[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>()

  for (const r of rows) {
    if (r.verifyToken) {
      out.set(r.id, r.verifyToken)
      continue
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const token = newVerifyToken()
        const res = await db.certificate.updateMany({
          where: { id: r.id, verifyToken: null },
          data: { verifyToken: token },
        })
        if (res.count === 1) out.set(r.id, token)
        else {
          const current = await db.certificate.findUnique({
            where: { id: r.id },
            select: { verifyToken: true },
          })
          if (current?.verifyToken) out.set(r.id, current.verifyToken)
        }
        break
      } catch {
        // 60-bit collision: retry.
      }
    }
  }

  return out
}
