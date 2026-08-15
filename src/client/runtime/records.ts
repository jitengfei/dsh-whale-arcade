import type { RunOutcome, RunResult } from './game-contract.ts'

export const RECORDS_STORAGE_KEY = 'dsh.whale-arcade.records.v2'
export const LEGACY_SCORES_STORAGE_KEY = 'dsh.whale-arcade.scores.v1'

export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface GameRecord {
  readonly outcome: RunOutcome
  readonly metrics: Readonly<Record<string, number>>
  readonly variantId?: string
  readonly durationMs: number
  readonly achievedAt: number
}

export interface GameResultRecordInput {
  readonly result: RunResult
  readonly durationMs: number
  readonly achievedAt?: number
}

export type SortDirection = 'asc' | 'desc'

export type RecordRankingRule =
  | { readonly field: 'metric'; readonly metricId: string; readonly direction: SortDirection }
  | { readonly field: 'durationMs' | 'achievedAt'; readonly direction: SortDirection }

interface BaseRecordPolicy {
  readonly limit?: number
  readonly outcomes?: readonly RunOutcome[]
}

export interface LeaderboardRecordPolicy extends BaseRecordPolicy {
  readonly kind: 'leaderboard'
  readonly rankBy: readonly RecordRankingRule[]
}

export interface HistoryRecordPolicy extends BaseRecordPolicy {
  readonly kind: 'history'
}

export interface NoRecordPolicy {
  readonly kind: 'none'
}

export type RecordPolicy = LeaderboardRecordPolicy | HistoryRecordPolicy | NoRecordPolicy

/** Matches the original arcade ordering: score, active duration, timestamp. */
export const HIGH_SCORE_POLICY = {
  kind: 'leaderboard',
  limit: 10,
  rankBy: [
    { field: 'metric', metricId: 'score', direction: 'desc' },
    { field: 'durationMs', direction: 'asc' },
    { field: 'achievedAt', direction: 'asc' },
  ],
} as const satisfies LeaderboardRecordPolicy

export const NO_RECORD_POLICY = { kind: 'none' } as const satisfies NoRecordPolicy

export interface ScoreEntry {
  readonly score: number
  readonly durationMs: number
  readonly achievedAt: number
}

interface RecordsDocumentV2 {
  readonly version: 2
  /** Values stay unknown so a write for one game cannot erase future formats. */
  readonly games: Record<string, unknown>
}

const OUTCOMES: readonly RunOutcome[] = ['completed', 'failed', 'won', 'lost', 'draw']

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeMetrics(value: unknown): Readonly<Record<string, number>> | null {
  if (!isObject(value)) return null
  const metrics: Record<string, number> = {}
  for (const [key, metric] of Object.entries(value)) {
    if (!isFiniteNumber(metric)) return null
    metrics[key] = metric
  }
  return metrics
}

function normalizeGameRecord(value: unknown): GameRecord | null {
  if (!isObject(value)) return null
  const metrics = normalizeMetrics(value.metrics)
  if (
    !OUTCOMES.includes(value.outcome as RunOutcome)
    || metrics === null
    || !isFiniteNumber(value.durationMs)
    || value.durationMs < 0
    || !isFiniteNumber(value.achievedAt)
    || (value.variantId !== undefined && typeof value.variantId !== 'string')
  ) return null

  return {
    outcome: value.outcome as RunOutcome,
    metrics,
    ...(typeof value.variantId === 'string' ? { variantId: value.variantId } : {}),
    durationMs: value.durationMs,
    achievedAt: value.achievedAt,
  }
}

function normalizeRecordList(value: unknown): GameRecord[] {
  if (!Array.isArray(value)) return []
  const records: GameRecord[] = []
  for (const item of value) {
    const record = normalizeGameRecord(item)
    if (record !== null) records.push(record)
  }
  return records
}

function normalizeLegacyScores(value: unknown): ScoreEntry[] {
  if (!Array.isArray(value)) return []
  const entries: ScoreEntry[] = []
  for (const item of value) {
    if (!isObject(item)) continue
    if (
      isFiniteNumber(item.score)
      && isFiniteNumber(item.durationMs)
      && item.durationMs >= 0
      && isFiniteNumber(item.achievedAt)
    ) entries.push({ score: item.score, durationMs: item.durationMs, achievedAt: item.achievedAt })
  }
  return entries
}

function fromLegacyScore(entry: ScoreEntry): GameRecord {
  return {
    outcome: 'completed',
    metrics: { score: entry.score },
    durationMs: entry.durationMs,
    achievedAt: entry.achievedAt,
  }
}

function resolveStorage(storage: StorageLike | null | undefined): StorageLike | null {
  if (storage !== undefined) return storage
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function readJson(storage: StorageLike, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function writeDocument(storage: StorageLike, document: RecordsDocumentV2): void {
  try {
    storage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(document))
  } catch {
    // Full, disabled, or privacy-restricted storage must never block a game.
  }
}

function parseDocument(value: unknown): RecordsDocumentV2 | null {
  if (!isObject(value) || value.version !== 2 || !isObject(value.games)) return null
  return { version: 2, games: { ...value.games } }
}

/** Read v2 and lazily copy every valid v1 game, including unknown game ids. */
function loadDocument(storage: StorageLike): RecordsDocumentV2 {
  const current = parseDocument(readJson(storage, RECORDS_STORAGE_KEY))
  const games: Record<string, unknown> = { ...(current?.games ?? {}) }
  const legacy = readJson(storage, LEGACY_SCORES_STORAGE_KEY)
  let migrated = current === null

  if (isObject(legacy)) {
    for (const [gameId, rawScores] of Object.entries(legacy)) {
      if (Object.hasOwn(games, gameId)) continue
      const scores = normalizeLegacyScores(rawScores)
      if (scores.length === 0) continue
      games[gameId] = scores.map(fromLegacyScore)
      migrated = true
    }
  }

  const document: RecordsDocumentV2 = { version: 2, games }
  if (migrated) writeDocument(storage, document)
  return document
}

function limitFor(policy: LeaderboardRecordPolicy | HistoryRecordPolicy): number {
  const fallback = policy.kind === 'leaderboard' ? 10 : 50
  return policy.limit === undefined || !Number.isSafeInteger(policy.limit) || policy.limit < 1
    ? fallback
    : policy.limit
}

function rankValue(record: GameRecord, rule: RecordRankingRule): number | undefined {
  if (rule.field === 'metric') return record.metrics[rule.metricId]
  if (rule.field === 'durationMs') return record.durationMs
  return record.achievedAt
}

function compareByRules(left: GameRecord, right: GameRecord, rules: readonly RecordRankingRule[]): number {
  for (const rule of rules) {
    const leftValue = rankValue(left, rule)
    const rightValue = rankValue(right, rule)
    if (leftValue === rightValue) continue
    if (leftValue === undefined) return 1
    if (rightValue === undefined) return -1
    return (leftValue - rightValue) * (rule.direction === 'asc' ? 1 : -1)
  }
  return 0
}

function applyPolicy(records: readonly GameRecord[], policy: RecordPolicy): GameRecord[] {
  if (policy.kind === 'none') return []
  const accepted = policy.outcomes === undefined
    ? [...records]
    : records.filter(record => policy.outcomes?.includes(record.outcome) === true)

  if (policy.kind === 'history') {
    return accepted
      .sort((left, right) => right.achievedAt - left.achievedAt)
      .slice(0, limitFor(policy))
  }

  const primary = policy.rankBy[0]
  const rankable = primary?.field === 'metric'
    ? accepted.filter(record => record.metrics[primary.metricId] !== undefined)
    : accepted
  return rankable
    .sort((left, right) => compareByRules(left, right, policy.rankBy))
    .slice(0, limitFor(policy))
}

function sameVariant(record: GameRecord, variantId: string | undefined): boolean {
  return record.variantId === variantId
}

/** Read normalized records without letting unavailable browser storage escape. */
export function readGameRecords(
  gameId: string,
  policy: RecordPolicy,
  storage?: StorageLike | null,
  variantId?: string,
): GameRecord[] {
  if (policy.kind === 'none') return []
  const target = resolveStorage(storage)
  if (target === null) return []
  const document = loadDocument(target)
  return applyPolicy(
    normalizeRecordList(document.games[gameId]).filter(record => sameVariant(record, variantId)),
    policy,
  )
}

/** Insert a completed run; unrelated and unknown game entries remain untouched. */
export function recordGameResult(
  gameId: string,
  policy: RecordPolicy,
  input: GameResultRecordInput,
  storage?: StorageLike | null,
): GameRecord[] {
  if (policy.kind === 'none') return []
  const target = resolveStorage(storage)
  const candidate = normalizeGameRecord({
    outcome: input.result.outcome,
    metrics: input.result.metrics,
    ...(input.result.variantId === undefined ? {} : { variantId: input.result.variantId }),
    durationMs: input.durationMs,
    achievedAt: input.achievedAt ?? Date.now(),
  })
  const variantId = input.result.variantId
  if (candidate === null) return target === null ? [] : readGameRecords(gameId, policy, target, variantId)
  if (target === null) return applyPolicy([candidate], policy)

  const document = loadDocument(target)
  const previous = normalizeRecordList(document.games[gameId])
  const otherVariants = previous.filter(record => !sameVariant(record, variantId))
  const table = applyPolicy([
    ...previous.filter(record => sameVariant(record, variantId)),
    candidate,
  ], policy)
  document.games[gameId] = [...otherVariants, ...table]
  writeDocument(target, document)
  return table
}

/** Compatibility adapter for the three original score-based games. */
export function readHighScores(gameId: string, storage?: StorageLike | null): ScoreEntry[] {
  return readGameRecords(gameId, HIGH_SCORE_POLICY, storage).map(record => ({
    score: record.metrics.score ?? 0,
    durationMs: record.durationMs,
    achievedAt: record.achievedAt,
  }))
}

/** Compatibility adapter with the same input and ordering as `recordScore`. */
export function recordHighScore(
  gameId: string,
  entry: ScoreEntry,
  storage?: StorageLike | null,
): ScoreEntry[] {
  return recordGameResult(gameId, HIGH_SCORE_POLICY, {
    result: { outcome: 'completed', metrics: { score: entry.score } },
    durationMs: entry.durationMs,
    achievedAt: entry.achievedAt,
  }, storage).map(record => ({
    score: record.metrics.score ?? 0,
    durationMs: record.durationMs,
    achievedAt: record.achievedAt,
  }))
}
