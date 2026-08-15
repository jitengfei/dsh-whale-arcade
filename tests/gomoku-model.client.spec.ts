import { describe, expect, it } from 'vitest'
import { chooseAiMove, difficultyFromVariant, GOMOKU_VARIANTS } from '../src/client/games/gomoku/ai.ts'
import {
  AI,
  createBoard,
  EMPTY,
  findWinningLine,
  hasFive,
  isWinningMove,
  nearbyMoves,
  placeStone,
  PLAYER,
  toIndex,
  winningMoves,
} from '../src/client/games/gomoku/model.ts'

describe('gomoku rules', () => {
  it('starts in the center and rejects an occupied intersection', () => {
    const board = createBoard()
    expect(nearbyMoves(board)).toEqual([toIndex(7, 7)])
    const next = placeStone(board, toIndex(7, 7), PLAYER)
    expect(next?.[toIndex(7, 7)]).toBe(PLAYER)
    expect(next === null ? null : placeStone(next, toIndex(7, 7), AI)).toBeNull()
    expect(board[toIndex(7, 7)]).toBe(EMPTY)
  })

  it('detects horizontal, vertical, and both diagonal five-stone lines', () => {
    for (const [rowStep, columnStep] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
      const board = createBoard()
      let last = 0
      for (let distance = 0; distance < 5; distance += 1) {
        last = toIndex(5 + rowStep * distance, 7 + columnStep * distance)
        board[last] = PLAYER
      }
      expect(hasFive(board, last)).toBe(true)
    }
  })

  it('does not end on four connected stones', () => {
    const board = createBoard()
    for (let column = 3; column < 7; column += 1) board[toIndex(8, column)] = PLAYER
    expect(hasFive(board, toIndex(8, 6))).toBe(false)
  })

  it('returns a stable five-cell winning line and keeps freestyle overlines valid', () => {
    const board = createBoard()
    for (let column = 2; column < 8; column += 1) board[toIndex(0, column)] = PLAYER

    const line = findWinningLine(board, toIndex(0, 7))
    expect(line).toHaveLength(5)
    expect(line).toContain(toIndex(0, 7))
    expect(line?.every(index => board[index] === PLAYER)).toBe(true)
    expect(hasFive(board, toIndex(0, 4))).toBe(true)
  })

  it('finds a line split around the last move without wrapping across rows', () => {
    const board = createBoard()
    for (const column of [3, 4, 6, 7]) board[toIndex(8, column)] = AI
    expect(isWinningMove(board, toIndex(8, 5), AI)).toBe(true)

    const wrapped = createBoard()
    for (const index of [13, 14, 15, 16, 17]) wrapped[index] = PLAYER
    expect(hasFive(wrapped, 17)).toBe(false)
  })
})

describe('gomoku local AI', () => {
  it('takes an immediate win at every difficulty', () => {
    const board = createBoard()
    for (let column = 4; column < 8; column += 1) board[toIndex(6, column)] = AI
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const move = chooseAiMove(board, difficulty, () => .5)
      expect(move).not.toBeNull()
      const next = move === null ? null : placeStone(board, move, AI)
      expect(next !== null && hasFive(next, move ?? -1)).toBe(true)
    }
  })

  it('blocks a player win at every difficulty', () => {
    const board = createBoard()
    for (let column = 4; column < 8; column += 1) board[toIndex(9, column)] = PLAYER
    const threats = winningMoves(board, PLAYER)
    expect(threats.length).toBeGreaterThan(0)
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      expect(threats).toContain(chooseAiMove(board, difficulty, () => 0))
    }
  })

  it('recognizes a broken four as a forcing move', () => {
    const board = createBoard()
    for (const column of [5, 6, 9]) board[toIndex(7, column)] = AI
    for (const [row, column] of [[4, 4], [5, 11], [10, 4], [11, 11]] as const) {
      board[toIndex(row, column)] = PLAYER
    }

    for (const difficulty of ['normal', 'hard'] as const) {
      const move = chooseAiMove(board, difficulty, () => .5)
      expect([toIndex(7, 7), toIndex(7, 8)]).toContain(move)
      const next = move === null ? null : placeStone(board, move, AI)
      expect(next === null ? [] : winningMoves(next, AI)).toHaveLength(1)
    }
  })

  it('builds and prevents compound open-three threats', () => {
    const attack = createBoard()
    for (const [row, column] of [[7, 5], [7, 6], [5, 7], [6, 7]] as const) {
      attack[toIndex(row, column)] = AI
    }
    for (const [row, column] of [[3, 3], [3, 11], [11, 3], [11, 11], [9, 9]] as const) {
      attack[toIndex(row, column)] = PLAYER
    }
    expect(chooseAiMove(attack, 'normal', () => .5)).toBe(toIndex(7, 7))

    const defense = createBoard()
    for (const [row, column] of [[7, 5], [7, 6], [5, 7], [6, 7]] as const) {
      defense[toIndex(row, column)] = PLAYER
    }
    for (const [row, column] of [[3, 3], [3, 11], [11, 3]] as const) {
      defense[toIndex(row, column)] = AI
    }
    expect(chooseAiMove(defense, 'normal', () => .5)).toBe(toIndex(7, 7))
    expect(chooseAiMove(defense, 'hard', () => .5)).toBe(toIndex(7, 7))
  })

  it('does not let hard mode reject its own forced open-four win', () => {
    const board = createBoard()
    for (const column of [6, 7, 8]) board[toIndex(7, column)] = AI
    for (const [row, column] of [[5, 7], [9, 9], [4, 4], [10, 11]] as const) {
      board[toIndex(row, column)] = PLAYER
    }

    for (const difficulty of ['normal', 'hard'] as const) {
      const move = chooseAiMove(board, difficulty, () => .5)
      const next = move === null ? null : placeStone(board, move, AI)
      expect(next === null ? [] : winningMoves(next, AI)).toHaveLength(2)
    }
  })

  it('returns a legal nearby move for each difficulty', () => {
    const board = createBoard()
    board[toIndex(7, 7)] = PLAYER
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const move = chooseAiMove(board, difficulty, () => .25)
      expect(move).not.toBeNull()
      expect(move === null ? undefined : board[move]).toBe(EMPTY)
      expect(nearbyMoves(board)).toContain(move)
    }
  })

  it('lets easy mode vary among several sensible nearby moves', () => {
    const board = createBoard()
    board[toIndex(7, 7)] = PLAYER
    const first = chooseAiMove(board, 'easy', () => 0)
    const later = chooseAiMove(board, 'easy', () => .99)
    expect(first).not.toBe(later)
    expect(nearbyMoves(board)).toContain(first)
    expect(nearbyMoves(board)).toContain(later)
  })

  it('never mutates the board while evaluating any difficulty', () => {
    const board = createBoard()
    board[toIndex(7, 7)] = PLAYER
    board[toIndex(6, 6)] = AI
    board[toIndex(8, 8)] = PLAYER
    const snapshot = [...board]

    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      expect(chooseAiMove(board, difficulty, () => .25)).not.toBeNull()
      expect(board).toEqual(snapshot)
    }
  })

  it('maps unknown rule ids to the normal difficulty', () => {
    expect(difficultyFromVariant(GOMOKU_VARIANTS.easy)).toBe('easy')
    expect(difficultyFromVariant(GOMOKU_VARIANTS.hard)).toBe('hard')
    expect(difficultyFromVariant('unknown')).toBe('normal')
  })
})
