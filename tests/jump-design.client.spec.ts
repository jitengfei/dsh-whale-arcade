import { describe, expect, it } from 'vitest'
import { createCave, jumpSpeed, positionNextCave } from '../src/client/jump-design.ts'

function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[index++] ?? values.at(-1) ?? 0
}

describe('whale cave pacing', () => {
  it('raises speed gradually and caps it', () => {
    expect(jumpSpeed(0)).toBe(26)
    expect(jumpSpeed(10)).toBe(29.5)
    expect(jumpSpeed(100)).toBe(36)
  })

  it('varies opening and spacing without creating edge-clipped gaps', () => {
    const wide = createCave(50, 0, 26, sequence(1, 0, 0))
    const narrow = createCave(50, 100, 36, sequence(0, 1, 1))
    expect(wide.opening).toBeGreaterThan(narrow.opening)
    for (const cave of [wide, narrow]) {
      expect(cave.gap - cave.opening / 2).toBeGreaterThanOrEqual(10)
      expect(cave.gap + cave.opening / 2).toBeLessThanOrEqual(90)
      expect(cave.gapBefore).toBeGreaterThanOrEqual(42)
      expect(cave.gapBefore).toBeLessThanOrEqual(78)
    }
  })

  it('limits consecutive vertical shifts to a reachable amount', () => {
    expect(createCave(70, 0, 26, sequence(.5, 0, .5)).gap).toBe(57)
    expect(createCave(30, 0, 26, sequence(.5, 1, .5)).gap).toBe(43)
  })

  it('adds reaction distance before the cave that makes a large shift', () => {
    const level = createCave(50, 10, 30, sequence(.5, .5, 0))
    const steep = createCave(50, 10, 30, sequence(.5, 1, 0))
    expect(steep.gapBefore).toBeGreaterThan(level.gapBefore)
    expect(positionNextCave(71, steep) - 71).toBe(steep.gapBefore)
  })
})
