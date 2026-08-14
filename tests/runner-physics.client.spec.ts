import { describe, expect, it } from 'vitest'
import {
  RUNNER_OBSTACLES,
  runnerCollides,
  type RunnerObstacleKind,
} from '../src/client/runner-physics.ts'

const WIDTH = 560
const HEIGHT = 300
const KINDS = ['conch', 'urchin', 'coral', 'wreck'] as const satisfies readonly RunnerObstacleKind[]

describe('whale runner collision geometry', () => {
  it('keeps every hit shape inside the geometry used for drawing', () => {
    expect(Object.keys(RUNNER_OBSTACLES).sort()).toEqual([...KINDS].sort())
    for (const geometry of Object.values(RUNNER_OBSTACLES)) {
      for (const shape of geometry.hitShapes) {
        if (shape.type === 'rect') {
          expect(shape.x).toBeGreaterThanOrEqual(0)
          expect(shape.y).toBeGreaterThanOrEqual(0)
          expect(shape.x + shape.width).toBeLessThanOrEqual(geometry.visualWidth)
          expect(shape.y + shape.height).toBeLessThanOrEqual(geometry.visualHeight)
        } else {
          expect(shape.x - shape.radius).toBeGreaterThanOrEqual(0)
          expect(shape.y - shape.radius).toBeGreaterThanOrEqual(0)
          expect(shape.x + shape.radius).toBeLessThanOrEqual(geometry.visualWidth)
          expect(shape.y + shape.radius).toBeLessThanOrEqual(geometry.visualHeight)
        }
      }
    }
  })

  it('keeps every obstacle reachable within the full jump arc', () => {
    for (const kind of KINDS) {
      expect(runnerCollides(WIDTH, HEIGHT, 0, { x: 18, kind })).toBe(true)
      expect(runnerCollides(WIDTH, HEIGHT, 16, { x: 18, kind })).toBe(false)
    }
  })

  it('creates meaningfully different clearance tiers', () => {
    expect(runnerCollides(WIDTH, HEIGHT, 4, { x: 18, kind: 'conch' })).toBe(true)
    expect(runnerCollides(WIDTH, HEIGHT, 5, { x: 18, kind: 'conch' })).toBe(false)

    expect(runnerCollides(WIDTH, HEIGHT, 5, { x: 18, kind: 'wreck' })).toBe(true)
    expect(runnerCollides(WIDTH, HEIGHT, 7, { x: 18, kind: 'wreck' })).toBe(false)

    expect(runnerCollides(WIDTH, HEIGHT, 7, { x: 18, kind: 'urchin' })).toBe(true)
    expect(runnerCollides(WIDTH, HEIGHT, 8, { x: 18, kind: 'urchin' })).toBe(false)

    expect(runnerCollides(WIDTH, HEIGHT, 11, { x: 18, kind: 'coral' })).toBe(true)
    expect(runnerCollides(WIDTH, HEIGHT, 12, { x: 18, kind: 'coral' })).toBe(false)
  })

  it('does not collide before horizontal visual overlap', () => {
    for (const kind of KINDS) {
      expect(runnerCollides(WIDTH, HEIGHT, 0, { x: 10, kind })).toBe(false)
      expect(runnerCollides(WIDTH, HEIGHT, 0, { x: 28, kind })).toBe(false)
    }
  })

  it('uses actual viewport pixels on desktop and narrow boards', () => {
    for (const width of [304, 560]) {
      for (const kind of KINDS) {
        expect(runnerCollides(width, HEIGHT, 0, { x: 18, kind })).toBe(true)
        expect(runnerCollides(width, HEIGHT, 16, { x: 18, kind })).toBe(false)
      }
    }
    expect(runnerCollides(0, HEIGHT, 0, { x: 18, kind: 'coral' })).toBe(false)
  })
})
