// Tarp sizing math shared by the size calculator and the sizing article.
//
// Tarps are sold by nominal ("cut") size. Hemming the edges and setting the rope
// and grommets makes the finished tarp smaller, typically about 3–5% per side
// dimension. We use 4% as a planning figure and round to the nearest inch.
// CONFIRM (Farshid): replace with the supplier's real finished-size spec if it differs.
export const FINISHED_RATIO = 0.96

/** Common standard (nominal) sizes in feet, width ≤ length. */
export const STANDARD_SIZES: ReadonlyArray<readonly [number, number]> = [
  [6, 8], [8, 10], [10, 12], [10, 20], [12, 16], [12, 20], [12, 24], [15, 20], [15, 30],
  [16, 20], [18, 24], [20, 20], [20, 30], [20, 40], [24, 36], [25, 40], [30, 40], [30, 50],
  [30, 60], [40, 50], [40, 60], [50, 60], [50, 100], [60, 100],
]

/** Approximate finished size in feet for a nominal dimension. */
export function finishedFt(nominalFt: number): number {
  return Math.round(nominalFt * FINISHED_RATIO * 12) / 12
}

/** Formats feet as e.g. 19′ 2″. */
export function formatFtIn(ft: number): string {
  const totalIn = Math.round(ft * 12)
  const f = Math.floor(totalIn / 12)
  const i = totalIn % 12
  return i ? `${f}′ ${i}″` : `${f}′`
}

export interface SizeInput {
  /** Area / object dimensions in feet. */
  width: number
  length: number
  /** Height of the object being covered (0 for a flat area). The tarp drapes down every side. */
  height: number
  /** Extra beyond the area on every side: overhang, ground contact, wrap around boards, tie-down. */
  allowance: number
}

export interface SizeResult {
  requiredWidth: number
  requiredLength: number
  /** Best fitting standard size (smallest area whose finished size covers the requirement), or null if larger than any standard size. */
  best: { width: number; length: number; finishedWidth: number; finishedLength: number } | null
  /** Next size up, for extra margin. */
  nextUp: { width: number; length: number; finishedWidth: number; finishedLength: number } | null
}

export function requiredSize({ width, length, height, allowance }: SizeInput) {
  const w = Math.max(0, width) + 2 * Math.max(0, height) + 2 * Math.max(0, allowance)
  const l = Math.max(0, length) + 2 * Math.max(0, height) + 2 * Math.max(0, allowance)
  return { requiredWidth: Math.min(w, l), requiredLength: Math.max(w, l) }
}

export function recommendSize(input: SizeInput, sizes = STANDARD_SIZES): SizeResult {
  const { requiredWidth, requiredLength } = requiredSize(input)
  const fits = sizes
    .map(([w, l]) => ({ width: w, length: l, finishedWidth: finishedFt(w), finishedLength: finishedFt(l) }))
    .filter((s) => s.finishedWidth >= requiredWidth - 1e-9 && s.finishedLength >= requiredLength - 1e-9)
    .sort((a, b) => a.width * a.length - b.width * b.length || a.length - b.length)
  return { requiredWidth, requiredLength, best: fits[0] ?? null, nextUp: fits[1] ?? null }
}
