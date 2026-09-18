/**
 * Where each value lands on the university's pre-printed degree stationery.
 *
 * The blank certificate carries everything fixed — crest, wording ("This is
 * to certify that…"), border, hologram, seal, signature lines. This system
 * prints only the values that differ per graduate, at these positions. The
 * genuineness of the degree comes from the controlled stationery and the wet
 * signature on it, not from anything a web page can draw.
 *
 * CALIBRATE BEFORE FIRST USE
 * --------------------------
 * These defaults suit a typical A4 landscape degree blank. The real blank's
 * layout is not known to this repository. To calibrate:
 *
 *   1. Admin → Certificates → "Print on stationery" → Alignment test, and
 *      print it on PLAIN paper at 100% scale.
 *   2. Lay it over a blank certificate against a window and note where each
 *      dashed box should move.
 *   3. Adjust x / y / w below (millimetres from the paper's top-left corner)
 *      and repeat until every box sits on its line.
 *
 * Per-printer drift (one printer feeds 1.5mm low) is handled by the offset
 * controls on the print screen, not here — this file is the blank, those are
 * the machine.
 */

export type Align = 'left' | 'center' | 'right'

export type FieldBox = {
  /** Left edge of the box, mm from the paper's left edge. */
  x: number
  /** Top of the text line, mm from the paper's top edge. */
  y: number
  /** Box width in mm. Text aligns within it and shrinks to fit. */
  w: number
  align: Align
  /** Font size in points. */
  size: number
  bold?: boolean
  italic?: boolean
  caps?: boolean
  /** Printed before the value, for blanks that leave the label blank. */
  prefix?: string
}

export type StationeryField =
  | 'studentName'
  | 'programme'
  | 'division'
  | 'awardYear'
  | 'certificateNo'
  | 'enrollmentNo'
  | 'issuedOn'
  | 'serial'

export const certificateStationery: {
  page: { width: number; height: number }
  fields: Record<StationeryField, FieldBox>
  qr: { x: number; y: number; size: number }
} = {
  // A4 landscape.
  page: { width: 297, height: 210 },

  fields: {
    studentName: { x: 48.5, y: 88, w: 200, align: 'center', size: 24, bold: true, caps: true },
    programme: { x: 48.5, y: 112, w: 200, align: 'center', size: 17, bold: true },
    division: { x: 48.5, y: 128, w: 200, align: 'center', size: 13, italic: true },
    awardYear: { x: 118.5, y: 141, w: 60, align: 'center', size: 13, bold: true },

    certificateNo: { x: 22, y: 20, w: 90, align: 'left', size: 10, prefix: 'Certificate No. ' },
    enrollmentNo: { x: 22, y: 26, w: 90, align: 'left', size: 10, prefix: 'Enrollment No. ' },
    issuedOn: { x: 22, y: 186, w: 80, align: 'left', size: 10, prefix: 'Date: ' },
    serial: { x: 235, y: 187.5, w: 50, align: 'center', size: 7 },
  },

  // Verification QR, bottom right.
  qr: { x: 247, y: 158, size: 26 },
}
