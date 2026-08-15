import { describe, expect, it } from 'vitest'
import {
  HIGH_SCORE_POLICY,
  LEGACY_SCORES_STORAGE_KEY,
  NO_RECORD_POLICY,
  RECORDS_STORAGE_KEY,
  readGameRecords,
  readHighScores,
  recordGameResult,
  recordHighScore,
  type HistoryRecordPolicy,
  type StorageLike,
} from '../../src/client/runtime/records.ts'

interface MemoryStorage extends StorageLike {
  readonly values: Map<string, string>
}

function memoryStorage(seed: Readonly<Record<string, string>> = {}): MemoryStorage {
  const values = new Map(Object.entries(seed))
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('versioned game records', () => {
  it('reads and lazily migrates every valid scores.v1 game', () => {
    const storage = memoryStorage({
      [LEGACY_SCORES_STORAGE_KEY]: JSON.stringify({
        jump: [
          { score: 3, durationMs: 900, achievedAt: 2 },
          { score: 8, durationMs: 1_200, achievedAt: 3 },
        ],
        future_game: [{ score: 42, durationMs: 500, achievedAt: 4 }],
      }),
    })

    expect(readHighScores('jump', storage).map(entry => entry.score)).toEqual([8, 3])
    const migrated = JSON.parse(storage.getItem(RECORDS_STORAGE_KEY) ?? 'null') as {
      version: number
      games: Record<string, unknown>
    }
    expect(migrated.version).toBe(2)
    expect(migrated.games.future_game).toEqual([{
      outcome: 'completed',
      metrics: { score: 42 },
      durationMs: 500,
      achievedAt: 4,
    }])
  })

  it('keeps unknown v2 game data unchanged while writing another game', () => {
    const unknown = { schema: 7, payload: ['leave', 'me', 'alone'] }
    const storage = memoryStorage({
      [RECORDS_STORAGE_KEY]: JSON.stringify({ version: 2, games: { future_game: unknown } }),
    })

    recordHighScore('jump', { score: 6, durationMs: 300, achievedAt: 10 }, storage)

    const stored = JSON.parse(storage.getItem(RECORDS_STORAGE_KEY) ?? 'null') as {
      games: Record<string, unknown>
    }
    expect(stored.games.future_game).toEqual(unknown)
  })

  it('applies the original high-score order and ten-entry limit', () => {
    const storage = memoryStorage()
    for (let index = 0; index < 12; index += 1) {
      recordHighScore('runner', {
        score: index === 10 ? 11 : index,
        durationMs: index === 10 ? 100 : 1_000 + index,
        achievedAt: index,
      }, storage)
    }

    const scores = readGameRecords('runner', HIGH_SCORE_POLICY, storage)
    expect(scores).toHaveLength(10)
    expect(scores[0]).toMatchObject({ metrics: { score: 11 }, durationMs: 100 })
    expect(scores[1]).toMatchObject({ metrics: { score: 11 }, durationMs: 1_011 })
  })

  it('supports bounded newest-first history and a policy with no persistence', () => {
    const historyPolicy: HistoryRecordPolicy = { kind: 'history', limit: 2 }
    const storage = memoryStorage()
    for (const achievedAt of [10, 30, 20]) {
      recordGameResult('gomoku', historyPolicy, {
        result: { outcome: achievedAt === 30 ? 'won' : 'lost', metrics: { moves: achievedAt } },
        durationMs: 100,
        achievedAt,
      }, storage)
    }
    expect(readGameRecords('gomoku', historyPolicy, storage).map(entry => entry.achievedAt)).toEqual([30, 20])

    const untouched = memoryStorage()
    expect(recordGameResult('zen', NO_RECORD_POLICY, {
      result: { outcome: 'completed', metrics: {} },
      durationMs: 5,
      achievedAt: 1,
    }, untouched)).toEqual([])
    expect(untouched.values.size).toBe(0)
  })

  it('keeps different rule variants in independent ranked tables', () => {
    const storage = memoryStorage()
    for (let score = 0; score < 12; score += 1) {
      for (const variantId of ['easy', 'hard']) {
        recordGameResult('future-versus', HIGH_SCORE_POLICY, {
          result: { outcome: 'won', metrics: { score }, variantId },
          durationMs: 100 + score,
          achievedAt: score,
        }, storage)
      }
    }

    const easy = readGameRecords('future-versus', HIGH_SCORE_POLICY, storage, 'easy')
    const hard = readGameRecords('future-versus', HIGH_SCORE_POLICY, storage, 'hard')
    expect(easy).toHaveLength(10)
    expect(hard).toHaveLength(10)
    expect(easy.every(record => record.variantId === 'easy')).toBe(true)
    expect(hard.every(record => record.variantId === 'hard')).toBe(true)
  })

  it('does not throw when browser storage is unavailable', () => {
    const unavailable: StorageLike = {
      getItem: () => { throw new Error('disabled') },
      setItem: () => { throw new Error('full') },
    }

    expect(() => recordHighScore('jump', {
      score: 1,
      durationMs: 10,
      achievedAt: 20,
    }, unavailable)).not.toThrow()
  })
})
