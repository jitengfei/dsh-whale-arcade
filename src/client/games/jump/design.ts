export interface CaveDesign {
  gap: number
  opening: number
  gapBefore: number
}

export function jumpSpeed(score: number): number {
  return 26 + Math.min(10, score * .35)
}

/** Generate reachable variety: bounded center shifts, shrinking openings, and varied reaction time. */
export function createCave(previousCenter: number, score: number, speed: number, random: () => number = Math.random): CaveDesign {
  const opening = Math.max(28, Math.min(38, 36 - score * .18 + (random() - .5) * 4))
  const lower = opening / 2 + 10
  const upper = 90 - opening / 2
  const maxShift = 13 + Math.min(11, score * .45)
  const gap = Math.max(lower, Math.min(upper, previousCenter + (random() * 2 - 1) * maxShift))
  const gapBefore = Math.min(78, Math.max(42, speed * (1.52 + random() * .5) + Math.abs(gap - previousCenter) * .22))
  return { gap, opening, gapBefore }
}

export function positionNextCave(previousX: number, cave: CaveDesign): number {
  return previousX + cave.gapBefore
}
