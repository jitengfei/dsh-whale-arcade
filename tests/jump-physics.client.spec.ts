import { describe, expect, it } from 'vitest'
import { cavePassedWhale, jumpCollides } from '../src/client/jump-physics.ts'

const cave = { x: 19, gap: 50, opening: 34, gapBefore: 50 }

describe('whale cave collision geometry', () => {
  it('uses actual width on desktop and narrow layouts', () => {
    for (const width of [304, 536]) {
      expect(jumpCollides(width, 300, 50, cave)).toBe(false)
      expect(jumpCollides(width, 300, 25, cave)).toBe(true)
    }
    expect(jumpCollides(536, 300, 25, { ...cave, x: 28 })).toBe(false)
    expect(jumpCollides(304, 300, 25, { ...cave, x: 28 })).toBe(true)
  })

  it('does not collide before horizontal overlap and scores only after passing', () => {
    expect(jumpCollides(536, 300, 25, { ...cave, x: 35 })).toBe(false)
    expect(cavePassedWhale(536, { ...cave, x: 8 })).toBe(true)
    expect(cavePassedWhale(536, { ...cave, x: 15 })).toBe(false)
    expect(cavePassedWhale(0, cave)).toBe(false)
  })
})
