import 'server-only'

export type ResultInput = {
  marksObtained?: number
  marksMax?: number
  subjects?: unknown[]
}

/**
 * Rejects marks that cannot be true.
 *
 * A published result now prints as a statement of marks carrying a serial the
 * public can verify, so an impossible figure is not a display glitch: it is a
 * university document asserting something false, with the university's own
 * verification service confirming it. The seed data shipped with "88 out of
 * 50" in a laboratory paper for months before the printed sheet made it
 * obvious; nothing downstream would ever have caught it.
 *
 * When subjects are supplied, the grand total must be their sum. It is
 * rejected rather than silently recomputed — a total that disagrees with its
 * own rows means the import is wrong somewhere, and the exam cell needs to
 * know which row rather than have it papered over.
 */
export function marksProblem(r: ResultInput, label: string): string | null {
  const obtained = Number(r.marksObtained) || 0
  const max = Number(r.marksMax) || 0
  if (obtained < 0 || max < 0) return `${label}: marks cannot be negative.`
  if (obtained > max) return `${label}: total obtained (${obtained}) exceeds the maximum (${max}).`

  const subjects = Array.isArray(r.subjects) ? (r.subjects as Record<string, unknown>[]) : []
  if (subjects.length === 0) return null

  let sumObtained = 0
  let sumMax = 0
  for (const sub of subjects) {
    const name = String(sub.code ?? sub.name ?? 'a subject')
    const o = Number(sub.obtained)
    const m = Number(sub.max)
    if (!Number.isFinite(o) || !Number.isFinite(m) || m <= 0) {
      return `${label}: ${name} needs numeric obtained and maximum marks.`
    }
    if (o < 0 || o > m) return `${label}: ${name} has ${o} out of ${m}.`

    const hasSplit = sub.theory !== undefined || sub.practical !== undefined
    if (hasSplit) {
      const t = Number(sub.theory ?? 0)
      const pr = Number(sub.practical ?? 0)
      if (t < 0 || pr < 0 || t + pr !== o) {
        return `${label}: ${name} theory (${t}) + practical (${pr}) must equal ${o}.`
      }
    }
    sumObtained += o
    sumMax += m
  }

  if (sumObtained !== obtained || sumMax !== max) {
    return (
      `${label}: grand total ${obtained}/${max} does not match the subjects, ` +
      `which add up to ${sumObtained}/${sumMax}.`
    )
  }
  return null
}
