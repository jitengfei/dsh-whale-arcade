export type GameId = 'jump' | 'catch' | 'runner'

export interface ScoreEntry { score: number; durationMs: number; achievedAt: number }

const KEY = 'dsh.whale-arcade.scores.v1'

/** Read the ten highest scores for one game. */
export function readScores(game: GameId): ScoreEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Record<GameId, ScoreEntry[]>>
    return parsed[game]?.filter(entry => Number.isFinite(entry.score) && Number.isFinite(entry.durationMs)) ?? []
  } catch {
    return []
  }
}

/** Insert a completed score and return the newly ordered table. */
export function recordScore(game: GameId, entry: ScoreEntry): ScoreEntry[] {
  const all: Partial<Record<GameId, ScoreEntry[]>> = {}
  for (const id of ['jump', 'catch', 'runner'] as const) all[id] = readScores(id)
  const table = [...(all[game] ?? []), entry]
    .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs || a.achievedAt - b.achievedAt)
    .slice(0, 10)
  all[game] = table
  localStorage.setItem(KEY, JSON.stringify(all))
  return table
}
