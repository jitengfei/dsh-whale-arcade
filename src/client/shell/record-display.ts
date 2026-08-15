import type { ArcadeGameDefinition } from '../game-registry.ts'
import type { HudMetric } from '../runtime/game-contract.ts'
import { readGameRecords, type GameRecord, type RecordPolicy, type RecordRankingRule } from '../runtime/records.ts'

export interface RankedRecords {
  readonly metric: HudMetric
  readonly rows: readonly GameRecord[]
}

function rankingValue(record: GameRecord, rule: RecordRankingRule): number | undefined {
  if (rule.field === 'metric') return record.metrics[rule.metricId]
  return record[rule.field]
}

/** Convert a game's first ranking rule into the shell's neutral metric display. */
export function readRankedRecords(definition: ArcadeGameDefinition, variantId?: string): RankedRecords | null {
  const policy: RecordPolicy = definition.recordPolicy
  if (policy.kind !== 'leaderboard') return null
  const rule = policy.rankBy[0]
  if (rule === undefined) return null
  const rows = readGameRecords(definition.id, policy, undefined, variantId)
  const firstValue = rows[0] === undefined ? undefined : rankingValue(rows[0], rule)
  const id = rule.field === 'metric' ? rule.metricId : rule.field
  return {
    metric: { id, labelKey: definition.recordLabelKey ?? (id === 'durationMs' ? 'duration' : 'score'), value: firstValue ?? 0 },
    rows,
  }
}

export function rankedRecordValue(record: GameRecord, definition: ArcadeGameDefinition): HudMetric | null {
  const policy: RecordPolicy = definition.recordPolicy
  if (policy.kind !== 'leaderboard') return null
  const rule = policy.rankBy[0]
  if (rule === undefined) return null
  const value = rankingValue(record, rule)
  if (value === undefined) return null
  const id = rule.field === 'metric' ? rule.metricId : rule.field
  return { id, labelKey: definition.recordLabelKey ?? (id === 'durationMs' ? 'duration' : 'score'), value }
}

export function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function formatMetric(metric: HudMetric, padScore = false): string {
  if (metric.id === 'durationMs') return formatDuration(metric.value)
  const value = Number.isInteger(metric.value) ? String(metric.value) : metric.value.toFixed(1)
  return padScore && metric.id === 'score' ? value.padStart(5, '0') : value
}
