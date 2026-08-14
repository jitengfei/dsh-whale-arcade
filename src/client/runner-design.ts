import type { RunnerObstacleKind, RunnerObstacleModel } from './runner-physics.ts'

export type RunnerGapBand = 'short' | 'medium' | 'long'
export type RunnerStage = 'intro' | 'mixed' | 'advanced'

export interface RunnerHistory {
  /** One primary kind per previously generated wave, oldest to newest. */
  recentKinds?: readonly RunnerObstacleKind[]
  /** One band per previously generated wave, oldest to newest. */
  recentGapBands?: readonly RunnerGapBand[]
}

export interface RunnerSpawn extends RunnerObstacleModel {
  /** Trailing-center to next-wave-center distance, expressed as viewport percent. */
  gapAfter: number
}

export interface RunnerWave {
  obstacles: RunnerSpawn[]
  primaryKind: RunnerObstacleKind
  gapBand: RunnerGapBand
  gapAfter: number
  reactionSeconds: number
}

interface Weighted<T> { value: T; weight: number }
interface Range { min: number; max: number }

const GAP_WEIGHTS: readonly Weighted<RunnerGapBand>[] = [
  { value: 'short', weight: .3 },
  { value: 'medium', weight: .45 },
  { value: 'long', weight: .25 },
]

const KIND_WEIGHTS: Readonly<Record<RunnerStage, readonly Weighted<RunnerObstacleKind>[]>> = {
  intro: [
    { value: 'conch', weight: .58 },
    { value: 'urchin', weight: .42 },
  ],
  mixed: [
    { value: 'conch', weight: .3 },
    { value: 'urchin', weight: .3 },
    { value: 'coral', weight: .22 },
    { value: 'wreck', weight: .18 },
  ],
  advanced: [
    { value: 'conch', weight: .23 },
    { value: 'urchin', weight: .22 },
    { value: 'coral', weight: .3 },
    { value: 'wreck', weight: .25 },
  ],
}

const EARLY_GAPS: Readonly<Record<RunnerGapBand, Range>> = {
  short: { min: 1.35, max: 1.6 },
  medium: { min: 1.75, max: 2.05 },
  long: { min: 2.2, max: 2.5 },
}

const LATE_GAPS: Readonly<Record<RunnerGapBand, Range>> = {
  short: { min: .9, max: 1.08 },
  medium: { min: 1.18, max: 1.42 },
  long: { min: 1.55, max: 1.85 },
}

function unit(value: number): number {
  return Math.min(1 - Number.EPSILON, Math.max(0, value))
}

function weightedPick<T>(entries: readonly Weighted<T>[], roll: number): T {
  const fallback = entries.at(-1)
  if (!fallback) throw new RangeError('runner choices must not be empty')
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = unit(roll) * total
  for (const entry of entries) {
    if (cursor < entry.weight) return entry.value
    cursor -= entry.weight
  }
  return fallback.value
}

function withoutThirdRepeat<T>(entries: readonly Weighted<T>[], history: readonly T[]): readonly Weighted<T>[] {
  const last = history.at(-1)
  if (last === undefined || history.at(-2) !== last) return entries
  const filtered = entries.filter(entry => entry.value !== last)
  return filtered.length > 0 ? filtered : entries
}

export function runnerSpeed(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds)
  return 34 + 16 * (1 - Math.exp(-elapsed / 42))
}

export function runnerStage(elapsedSeconds: number): RunnerStage {
  if (elapsedSeconds < 12) return 'intro'
  if (elapsedSeconds < 35) return 'mixed'
  return 'advanced'
}

export function runnerGapRange(elapsedSeconds: number, band: RunnerGapBand): Range {
  const difficulty = Math.min(1, Math.max(0, elapsedSeconds) / 90)
  const early = EARLY_GAPS[band]
  const late = LATE_GAPS[band]
  return {
    min: early.min + (late.min - early.min) * difficulty,
    max: early.max + (late.max - early.max) * difficulty,
  }
}

/** Generate one obstacle wave with staged variety and a reaction-time-derived spatial gap. */
export function createRunnerWave(
  elapsedSeconds: number,
  speed: number,
  history: RunnerHistory = {},
  random: () => number = Math.random,
): RunnerWave {
  // Keep the draw count stable so deterministic tests and seeded games stay simple.
  const gapRoll = random()
  const kindRoll = random()
  const groupRoll = random()
  const companionRoll = random()
  const distanceRoll = random()

  const stage = runnerStage(elapsedSeconds)
  const gapBand = weightedPick(
    withoutThirdRepeat(GAP_WEIGHTS, history.recentGapBands ?? []),
    gapRoll,
  )
  const primaryKind = weightedPick(
    withoutThirdRepeat(KIND_WEIGHTS[stage], history.recentKinds ?? []),
    kindRoll,
  )

  const lowKind = primaryKind === 'conch' || primaryKind === 'urchin'
  const grouped = stage === 'advanced' && lowKind && groupRoll < .4
  const kinds: RunnerObstacleKind[] = [primaryKind]
  if (grouped) {
    const companion = companionRoll < .55
      ? (primaryKind === 'conch' ? 'urchin' : 'conch')
      : primaryKind
    kinds.push(companion)
  }

  const range = runnerGapRange(elapsedSeconds, gapBand)
  const baseReaction = range.min + (range.max - range.min) * unit(distanceRoll)
  const recovery = grouped ? .28 : primaryKind === 'coral' ? .14 : primaryKind === 'wreck' ? .1 : 0
  const reactionSeconds = baseReaction + recovery
  const gapAfter = Math.min(96, Math.max(30, Math.max(0, speed) * reactionSeconds))
  const obstacles = kinds.map((kind, index) => ({
    x: 112 + index * 10,
    kind,
    gapAfter,
  }))

  return { obstacles, primaryKind, gapBand, gapAfter, reactionSeconds }
}
