import { describe, expect, it } from 'vitest'
import {
  createRunnerWave,
  runnerGapRange,
  runnerSpeed,
  runnerStage,
} from '../src/client/runner-design.ts'

function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[index++] ?? values.at(-1) ?? 0
}

describe('whale runner pacing', () => {
  it('uses a smooth 34-to-50 speed curve', () => {
    expect(runnerSpeed(0)).toBe(34)
    expect(runnerSpeed(30)).toBeCloseTo(42.17, 2)
    expect(runnerSpeed(60)).toBeCloseTo(46.17, 2)
    expect(runnerSpeed(90)).toBeCloseTo(48.12, 2)
    expect(runnerSpeed(999)).toBeCloseTo(50, 8)
    expect(runnerSpeed(-20)).toBe(34)
  })

  it('uses visibly different short, medium, and long temporal bands', () => {
    expect(runnerGapRange(0, 'short')).toEqual({ min: 1.35, max: 1.6 })
    expect(runnerGapRange(0, 'medium')).toEqual({ min: 1.75, max: 2.05 })
    expect(runnerGapRange(0, 'long')).toEqual({ min: 2.2, max: 2.5 })
    expect(runnerGapRange(90, 'short')).toEqual({ min: .9, max: 1.08 })

    const short = createRunnerWave(0, 34, {}, sequence(0, 0, 1, 0, 0))
    const long = createRunnerWave(0, 34, {}, sequence(1, 0, 1, 0, 1))
    expect(short.gapBand).toBe('short')
    expect(long.gapBand).toBe('long')
    expect(short.gapAfter).toBeCloseTo(34 * 1.35)
    expect(long.gapAfter).toBeCloseTo(34 * 2.5)
  })

  it('unlocks tall and wide obstacles in stages', () => {
    expect(runnerStage(0)).toBe('intro')
    expect(runnerStage(12)).toBe('mixed')
    expect(runnerStage(35)).toBe('advanced')

    const intro = createRunnerWave(5, 35, {}, sequence(.5, 1, 0, 0, .5))
    const mixed = createRunnerWave(20, 40, {}, sequence(.5, 1, 0, 0, .5))
    expect(['conch', 'urchin']).toContain(intro.primaryKind)
    expect(mixed.primaryKind).toBe('wreck')
    expect(intro.obstacles).toHaveLength(1)
    expect(mixed.obstacles).toHaveLength(1)
  })

  it('only creates readable two-obstacle low combinations in the advanced stage', () => {
    const early = createRunnerWave(20, 40, {}, sequence(.5, 0, 0, 0, .5))
    const group = createRunnerWave(40, 44, {}, sequence(.5, 0, 0, 0, .5))
    expect(early.obstacles).toHaveLength(1)
    expect(group.obstacles.map(item => item.kind)).toEqual(['conch', 'urchin'])
    expect(group.obstacles[1]!.x - group.obstacles[0]!.x).toBe(10)
    expect(group.reactionSeconds).toBeGreaterThan(runnerGapRange(40, group.gapBand).min)
  })

  it('prevents a third identical obstacle type or gap band', () => {
    const wave = createRunnerWave(50, 46, {
      recentKinds: ['coral', 'coral'],
      recentGapBands: ['short', 'short'],
    }, sequence(0, .55, 1, 0, .5))
    expect(wave.primaryKind).not.toBe('coral')
    expect(wave.gapBand).not.toBe('short')
  })

  it('keeps faster waves farther apart in space for similar reaction time', () => {
    const randomValues = [0, 0, 1, 0, .5]
    const slow = createRunnerWave(30, 36, {}, sequence(...randomValues))
    const fast = createRunnerWave(30, 48, {}, sequence(...randomValues))
    expect(fast.reactionSeconds).toBeCloseTo(slow.reactionSeconds)
    expect(fast.gapAfter).toBeGreaterThan(slow.gapAfter)
    expect(fast.gapAfter).toBeLessThanOrEqual(96)
  })
})
