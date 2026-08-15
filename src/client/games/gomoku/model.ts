export const GOMOKU_SIZE = 15
export const GOMOKU_CELLS = GOMOKU_SIZE * GOMOKU_SIZE

export const EMPTY = 0
export const PLAYER = 1
export const AI = 2

export type Stone = typeof EMPTY | typeof PLAYER | typeof AI
export type Board = readonly Stone[]

const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]] as const

export function createBoard(): Stone[] {
  return Array.from<Stone>({ length: GOMOKU_CELLS }).fill(EMPTY)
}

export function toIndex(row: number, column: number): number {
  return row * GOMOKU_SIZE + column
}

export function toPoint(index: number): { readonly row: number; readonly column: number } {
  return { row: Math.floor(index / GOMOKU_SIZE), column: index % GOMOKU_SIZE }
}

export function isInside(row: number, column: number): boolean {
  return row >= 0 && row < GOMOKU_SIZE && column >= 0 && column < GOMOKU_SIZE
}

export function placeStone(board: Board, index: number, stone: Exclude<Stone, typeof EMPTY>): Stone[] | null {
  if (!Number.isInteger(index) || index < 0 || index >= GOMOKU_CELLS || board[index] !== EMPTY) return null
  const next = [...board]
  next[index] = stone
  return next
}

function countDirection(board: Board, index: number, stone: Stone, rowStep: number, columnStep: number): number {
  const origin = toPoint(index)
  let count = 0
  for (let distance = 1; distance < GOMOKU_SIZE; distance += 1) {
    const row = origin.row + rowStep * distance
    const column = origin.column + columnStep * distance
    if (!isInside(row, column) || board[toIndex(row, column)] !== stone) break
    count += 1
  }
  return count
}

/**
 * Returns one stable five-stone segment through the last move.
 *
 * Whale Arcade uses freestyle Gomoku: a line longer than five also wins. In
 * that case the returned segment is the first five-cell window that still
 * contains the last move, which keeps rendering deterministic.
 */
export function findWinningLine(board: Board, index: number): readonly number[] | null {
  const stone = board[index]
  if (stone === undefined || stone === EMPTY) return null

  const origin = toPoint(index)
  for (const [rowStep, columnStep] of DIRECTIONS) {
    const before = countDirection(board, index, stone, -rowStep, -columnStep)
    const after = countDirection(board, index, stone, rowStep, columnStep)
    const length = before + 1 + after
    if (length < 5) continue

    const originOffset = before
    const startOffset = Math.min(Math.max(originOffset - 4, 0), length - 5)
    return Array.from({ length: 5 }, (_, distance) => {
      const lineOffset = startOffset + distance - before
      return toIndex(
        origin.row + rowStep * lineOffset,
        origin.column + columnStep * lineOffset,
      )
    })
  }
  return null
}

export function hasFive(board: Board, index: number): boolean {
  return findWinningLine(board, index) !== null
}

export function isBoardFull(board: Board): boolean {
  return board.every(stone => stone !== EMPTY)
}

/** Empty intersections near existing stones keep AI work small and moves natural. */
export function nearbyMoves(board: Board, radius = 2): number[] {
  const occupied = board.flatMap((stone, index) => stone === EMPTY ? [] : [index])
  if (occupied.length === 0) return [toIndex(7, 7)]
  const candidates = new Set<number>()
  for (const index of occupied) {
    const point = toPoint(index)
    for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
      for (let columnOffset = -radius; columnOffset <= radius; columnOffset += 1) {
        const row = point.row + rowOffset
        const column = point.column + columnOffset
        if (!isInside(row, column)) continue
        const candidate = toIndex(row, column)
        if (board[candidate] === EMPTY) candidates.add(candidate)
      }
    }
  }
  return [...candidates]
}

/** Tests a hypothetical freestyle-Gomoku move without copying the board. */
export function isWinningMove(board: Board, index: number, stone: Exclude<Stone, typeof EMPTY>): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= GOMOKU_CELLS || board[index] !== EMPTY) return false
  return DIRECTIONS.some(([rowStep, columnStep]) => (
    1
      + countDirection(board, index, stone, rowStep, columnStep)
      + countDirection(board, index, stone, -rowStep, -columnStep)
    >= 5
  ))
}

export function winningMoves(board: Board, stone: Exclude<Stone, typeof EMPTY>): number[] {
  return nearbyMoves(board).filter(index => isWinningMove(board, index, stone))
}
