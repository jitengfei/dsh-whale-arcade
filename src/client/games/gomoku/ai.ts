import {
  AI,
  EMPTY,
  GOMOKU_SIZE,
  hasFive,
  isInside,
  isWinningMove,
  nearbyMoves,
  placeStone,
  PLAYER,
  toIndex,
  toPoint,
  winningMoves,
  type Board,
} from './model.ts'

export type GomokuDifficulty = 'easy' | 'normal' | 'hard'

type Side = typeof PLAYER | typeof AI

const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]] as const
const WIN_SCORE = 1_000_000_000
const FORCED_WIN_SCORE = 50_000_000
const FOUR_SCORE = 2_000_000
const COMPOUND_THREE_SCORE = 220_000
const THREE_SCORE = 28_000
const DEFENSE_WEIGHT = 1.08

/** Hard mode explores at most 8 × 6 × 6 moves (288 leaf positions). */
const HARD_DEPTH = 3
const HARD_ROOT_WIDTH = 8
const HARD_SEARCH_WIDTH = 6

const ThreatLevel = {
  Quiet: 0,
  Three: 1,
  CompoundThree: 2,
  Four: 3,
  ForcedWin: 4,
  Win: 5,
} as const

type ThreatLevel = typeof ThreatLevel[keyof typeof ThreatLevel]

interface MoveThreat {
  readonly level: ThreatLevel
  readonly score: number
}

interface RankedMove {
  readonly index: number
  readonly score: number
  readonly attack: MoveThreat
  readonly defense: MoveThreat
}

export const GOMOKU_VARIANTS = {
  easy: 'gomoku-easy',
  normal: 'gomoku-normal',
  hard: 'gomoku-hard',
} as const satisfies Record<GomokuDifficulty, string>

export function difficultyFromVariant(variantId: string | undefined): GomokuDifficulty {
  if (variantId === GOMOKU_VARIANTS.easy) return 'easy'
  if (variantId === GOMOKU_VARIANTS.hard) return 'hard'
  return 'normal'
}

function otherSide(side: Side): Side {
  return side === PLAYER ? AI : PLAYER
}

/** Scores every unblocked five-cell window through a hypothetical move. */
function windowPotential(board: Board, index: number, stone: Side): {
  readonly score: number
  readonly threeDirections: number
} {
  if (board[index] !== EMPTY) return { score: Number.NEGATIVE_INFINITY, threeDirections: 0 }
  const origin = toPoint(index)
  let score = 0
  let threeDirections = 0

  for (const [rowStep, columnStep] of DIRECTIONS) {
    let directionHasThree = false
    for (let windowStart = -4; windowStart <= 0; windowStart += 1) {
      let own = 0
      let blocked = false
      for (let offset = windowStart; offset < windowStart + 5; offset += 1) {
        const row = origin.row + rowStep * offset
        const column = origin.column + columnStep * offset
        if (!isInside(row, column)) {
          blocked = true
          break
        }
        const value = offset === 0 ? stone : board[toIndex(row, column)]
        if (value === otherSide(stone)) {
          blocked = true
          break
        }
        if (value === stone) own += 1
      }
      if (blocked) continue

      if (own === 5) score += 5_000_000
      else if (own === 4) score += 120_000
      else if (own === 3) {
        score += 6_000
        directionHasThree = true
      } else if (own === 2) score += 260
      else score += 8
    }
    if (directionHasThree) threeDirections += 1
  }

  const center = (GOMOKU_SIZE - 1) / 2
  const centerBonus = Math.max(0, 18 - Math.abs(origin.row - center) - Math.abs(origin.column - center))
  return { score: score + centerBonus, threeDirections }
}

/** Winning replies newly created by a move must share one of its four lines. */
function createdWinningReplies(board: Board, index: number, stone: Side): number {
  const origin = toPoint(index)
  const candidates = new Set<number>()
  for (const [rowStep, columnStep] of DIRECTIONS) {
    for (let offset = -4; offset <= 4; offset += 1) {
      if (offset === 0) continue
      const row = origin.row + rowStep * offset
      const column = origin.column + columnStep * offset
      if (!isInside(row, column)) continue
      const candidate = toIndex(row, column)
      if (board[candidate] === EMPTY) candidates.add(candidate)
    }
  }

  let count = 0
  for (const candidate of candidates) {
    if (!isWinningMove(board, candidate, stone)) continue
    count += 1
    if (count >= 2) return count
  }
  return count
}

/**
 * Classifies a move by its concrete next-turn winning points. This recognizes
 * straight and broken fours without relying on a fragile list of string
 * patterns; the window score supplies open/broken threes and compound shapes.
 */
function moveThreat(board: Board, index: number, stone: Side): MoveThreat {
  const shape = windowPotential(board, index, stone)
  if (!Number.isFinite(shape.score)) return { level: ThreatLevel.Quiet, score: Number.NEGATIVE_INFINITY }
  const next = placeStone(board, index, stone)
  if (next === null) return { level: ThreatLevel.Quiet, score: Number.NEGATIVE_INFINITY }
  if (hasFive(next, index)) return { level: ThreatLevel.Win, score: WIN_SCORE }

  const replies = createdWinningReplies(next, index, stone)
  if (replies >= 2) {
    return { level: ThreatLevel.ForcedWin, score: FORCED_WIN_SCORE + shape.score }
  }
  if (replies === 1) {
    return { level: ThreatLevel.Four, score: FOUR_SCORE + shape.score }
  }
  if (shape.threeDirections >= 2) {
    return { level: ThreatLevel.CompoundThree, score: COMPOUND_THREE_SCORE + shape.score }
  }
  if (shape.threeDirections === 1) {
    return { level: ThreatLevel.Three, score: THREE_SCORE + shape.score }
  }
  return { level: ThreatLevel.Quiet, score: shape.score }
}

function rankedMoves(board: Board, side: Side): RankedMove[] {
  const opponent = otherSide(side)
  return nearbyMoves(board).map((index) => {
    const attack = moveThreat(board, index, side)
    const defense = moveThreat(board, index, opponent)
    return {
      index,
      attack,
      defense,
      score: attack.score + defense.score * DEFENSE_WEIGHT,
    }
  }).sort((left, right) => right.score - left.score || left.index - right.index)
}

function randomFrom<T>(items: readonly T[], random: () => number): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]
}

function topPositionScores(board: Board, side: Side): readonly [number, number] {
  let first = 0
  let second = 0
  for (const index of nearbyMoves(board)) {
    const score = windowPotential(board, index, side).score
    if (score > first) {
      second = first
      first = score
    } else if (score > second) second = score
  }
  return [first, second]
}

/** Fast leaf evaluation from the requested side's point of view. */
function evaluatePosition(board: Board, side: Side): number {
  const opponent = otherSide(side)
  const ownWins = winningMoves(board, side).length
  const opponentWins = winningMoves(board, opponent).length
  if (ownWins > 0) return FORCED_WIN_SCORE + ownWins * FOUR_SCORE
  if (opponentWins > 0) return -(FORCED_WIN_SCORE + opponentWins * FOUR_SCORE)

  const own = topPositionScores(board, side)
  const theirs = topPositionScores(board, opponent)
  return own[0] + own[1] * .24 - (theirs[0] + theirs[1] * .24) * DEFENSE_WEIGHT
}

function orderedSearchMoves(board: Board, side: Side, width: number): number[] {
  const wins = winningMoves(board, side)
  if (wins.length > 0) return wins.slice(0, width)

  const blocks = winningMoves(board, otherSide(side))
  if (blocks.length > 0) return blocks.slice(0, width)

  const ranked = rankedMoves(board, side)
  const forced = ranked.filter(move => move.attack.level === ThreatLevel.ForcedWin)
  if (forced.length > 0) return forced.slice(0, width).map(move => move.index)

  // Always put fork-prevention points before the width cut. Counter-attacking
  // fours remain in score order directly after them and are still searched.
  const preventsFork = ranked.filter(move => move.defense.level === ThreatLevel.ForcedWin)
  const prioritized = [...preventsFork, ...ranked]
  const seen = new Set<number>()
  const result: number[] = []
  for (const move of prioritized) {
    if (seen.has(move.index)) continue
    seen.add(move.index)
    result.push(move.index)
    if (result.length >= width) break
  }
  return result
}

function negamax(board: Board, side: Side, depth: number, alpha: number, beta: number, ply: number): number {
  if (depth <= 0) return evaluatePosition(board, side)
  const moves = orderedSearchMoves(board, side, HARD_SEARCH_WIDTH)
  if (moves.length === 0) return 0

  let best = Number.NEGATIVE_INFINITY
  let lowerBound = alpha
  for (const index of moves) {
    const next = placeStone(board, index, side)
    if (next === null) continue
    const score = hasFive(next, index)
      ? WIN_SCORE - ply
      : -negamax(next, otherSide(side), depth - 1, -beta, -lowerBound, ply + 1)
    best = Math.max(best, score)
    lowerBound = Math.max(lowerBound, score)
    if (lowerBound >= beta) break
  }
  return best
}

/** Local AI with shared tactical safety and bounded search by difficulty. */
export function chooseAiMove(board: Board, difficulty: GomokuDifficulty, random: () => number = Math.random): number | null {
  const wins = winningMoves(board, AI)
  if (wins[0] !== undefined) return wins[0]

  // Even easy mode should never appear broken by ignoring a one-move loss.
  const blocks = winningMoves(board, PLAYER)
  if (blocks[0] !== undefined) return blocks[0]

  const ranked = rankedMoves(board, AI)
  const first = ranked[0]
  if (first === undefined) return null

  const forcedWin = ranked.find(move => move.attack.level === ThreatLevel.ForcedWin)
  if (forcedWin !== undefined && difficulty !== 'easy') return forcedWin.index

  if (difficulty === 'easy') {
    return randomFrom(ranked.slice(0, Math.min(7, ranked.length)), random)?.index ?? first.index
  }
  if (difficulty === 'normal') return first.index

  const rootMoves = orderedSearchMoves(board, AI, HARD_ROOT_WIDTH)
  let bestIndex = rootMoves[0] ?? first.index
  let bestScore = Number.NEGATIVE_INFINITY
  let alpha = Number.NEGATIVE_INFINITY
  for (const index of rootMoves) {
    const next = placeStone(board, index, AI)
    if (next === null) continue
    const score = hasFive(next, index)
      ? WIN_SCORE
      : -negamax(next, PLAYER, HARD_DEPTH - 1, Number.NEGATIVE_INFINITY, -alpha, 1)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
    alpha = Math.max(alpha, score)
  }
  return bestIndex
}

export function aiDelay(difficulty: GomokuDifficulty): number {
  if (difficulty === 'easy') return 180
  if (difficulty === 'hard') return 360
  return 260
}
