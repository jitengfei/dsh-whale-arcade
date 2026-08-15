import { catchGame } from './games/catch/definition.tsx'
import { gomokuGame } from './games/gomoku/definition.tsx'
import { jumpGame } from './games/jump/definition.tsx'
import { runnerGame } from './games/runner/definition.tsx'
import type { GameDefinition } from './runtime/game-contract.ts'
import type { RecordPolicy } from './runtime/records.ts'

export type ArcadeGameDefinition = Omit<GameDefinition<string, RecordPolicy>, 'recordPolicy'> & {
  readonly recordPolicy: RecordPolicy
}

/** Ordered source for catalog cards, game rendering, and record navigation. */
export const GAMES = [jumpGame, catchGame, runnerGame, gomokuGame] as const satisfies readonly ArcadeGameDefinition[]

export type RegisteredGame = typeof GAMES[number]
export type GameId = RegisteredGame['id']
export type RegisteredArcadeGameDefinition = ArcadeGameDefinition & { readonly id: GameId }

/** Resolve a compile-time registered game without duplicating switch branches. */
export function findGame(id: GameId): RegisteredArcadeGameDefinition {
  const definition = GAMES.find(game => game.id === id)
  if (definition === undefined) throw new Error(`Unknown whale arcade game: ${id}`)
  return definition
}
