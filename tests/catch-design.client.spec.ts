import { describe, expect, it } from 'vitest'
import { catchSpawnDelay, createCatchDesign, scheduleCatchSpawn } from '../src/client/games/catch/design.ts'
import { catchCollides, catchHitOutcome } from '../src/client/games/catch/physics.ts'

function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[index++] ?? values.at(-1) ?? 0
}

describe('whale treasure balance', () => {
  it('keeps high-value pearls rarer and hazards bounded', () => {
    expect(createCatchDesign(0, sequence(.5, .05, .5)).kind).toBe('star')
    expect(createCatchDesign(0, sequence(.5, .95, .5)).kind).toBe('pearl')
    expect(createCatchDesign(0, sequence(.19, .1, .5)).kind).toBe('jelly')
    expect(createCatchDesign(600, sequence(.27, .9, .5)).kind).toBe('urchin')
    expect(createCatchDesign(60, sequence(.2799, .1, .5)).hazard).toBe(true)
    expect(createCatchDesign(60, sequence(.2801, .1, .5)).hazard).toBe(false)
    expect(createCatchDesign(600, sequence(.5, .95, .5)).speed).toBeCloseTo(48 * 1.28)
  })

  it('keeps every generated object on one of seven fully visible lanes', () => {
    const lanes = Array.from({ length: 7 }, (_, lane) => createCatchDesign(0, sequence(.5, .05, (lane + .5) / 7)).x)
    expect(lanes).toEqual([10, 23.333333333333336, 36.66666666666667, 50, 63.333333333333336, 76.66666666666667, 90])
  })

  it('varies spawn delay and increases difficulty gradually', () => {
    expect(catchSpawnDelay(0, sequence(0))).toBeCloseTo(.8)
    expect(catchSpawnDelay(0, sequence(1))).toBeCloseTo(1.04)
    expect(catchSpawnDelay(60, sequence(.5))).toBeCloseTo(.64)
    expect(catchSpawnDelay(60, sequence(0))).toBeCloseTo(.52)
    expect(catchSpawnDelay(60, sequence(1))).toBeCloseTo(.76)
  })

  it('delays a pending item without rerolling it when adjacent-lane arrivals conflict', () => {
    const pearl = createCatchDesign(0, sequence(.5, .95, .5))
    const scheduled = scheduleCatchSpawn([{ x: 50, hazard: false, arrivalAt: 3 }], pearl, 1.2)
    expect(scheduled.arrivalAt).toBeGreaterThanOrEqual(3.38)
    expect(scheduled.spawnAt).toBeGreaterThan(1.2)
    const parallel = scheduleCatchSpawn([{ x: 10, hazard: true, arrivalAt: 3 }], pearl, 1.2)
    expect(parallel.spawnAt).toBe(1.2)
  })

  it('uses actual viewport pixels for desktop and narrow collision', () => {
    for (const width of [304, 536]) {
      expect(catchCollides(width, 300, 50, { x: 50, y: 83, size: 30 })).toBe(true)
      expect(catchCollides(width, 300, 50, { x: 75, y: 83, size: 30 })).toBe(false)
    }
  })

  it('adds every reward in a collision frame before reporting a hazard', () => {
    const items = [
      { id: 1, x: 50, y: 83, size: 30, value: 10, hazard: false },
      { id: 2, x: 50, y: 83, size: 30, value: 25, hazard: false },
      { id: 3, x: 50, y: 83, size: 30, value: 0, hazard: true },
    ]
    const forward = catchHitOutcome(536, 300, 50, items)
    const reversed = catchHitOutcome(536, 300, 50, [...items].reverse())
    expect(forward.gained).toBe(35)
    expect(reversed.gained).toBe(35)
    expect(forward.hazardX).toBe(50)
    expect(reversed.hazardX).toBe(50)
  })
})
