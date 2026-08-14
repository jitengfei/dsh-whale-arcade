export type GameId = 'jump' | 'catch' | 'runner'

export interface ScoreEntry { score: number; durationMs: number; achievedAt: number }

const KEY = 'dsh.whale-arcade.scores.v1'

function normalizeScores(value: unknown): ScoreEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is ScoreEntry => {
      if (typeof entry !== 'object' || entry === null) return false
      const candidate = entry as Partial<ScoreEntry>
      return Number.isFinite(candidate.score) && Number.isFinite(candidate.durationMs) && Number.isFinite(candidate.achievedAt)
    })
    .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs || a.achievedAt - b.achievedAt)
    .slice(0, 10)
}

/** Read the ten highest scores for one game. */
export function readScores(game: GameId): ScoreEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Record<GameId, unknown>>
    return normalizeScores(parsed[game])
  } catch {
    return []
  }
}

/** Insert a completed score and return the newly ordered table. */
export function recordScore(game: GameId, entry: ScoreEntry): ScoreEntry[] {
  const all: Partial<Record<GameId, ScoreEntry[]>> = {}
  for (const id of ['jump', 'catch', 'runner'] as const) all[id] = readScores(id)
  const table = normalizeScores([...(all[game] ?? []), entry])
  all[game] = table
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // A full, disabled, or privacy-restricted store must never block game over.
  }
  return table
}
