import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameViewProps } from '../../runtime/game-contract.ts'
import { aiDelay, chooseAiMove, difficultyFromVariant } from './ai.ts'
import styles from './GomokuGame.module.css'
import {
  AI,
  createBoard,
  EMPTY,
  findWinningLine,
  GOMOKU_CELLS,
  GOMOKU_SIZE,
  isBoardFull,
  placeStone,
  PLAYER,
  toPoint,
  type Stone,
} from './model.ts'
import { WhaleStone } from './WhaleStone.tsx'

const STAR_POINTS = new Set([48, 56, 112, 168, 176])
const CENTER = 112

function cellLabel(translate: GameViewProps['translate'], index: number, stone: Stone, last: boolean): string {
  const point = toPoint(index)
  const key = stone === PLAYER ? 'gomoku.cell.player' : stone === AI ? 'gomoku.cell.ai' : 'gomoku.cell.empty'
  const position = translate(key, { row: point.row + 1, column: point.column + 1 })
  return last ? `${position} · ${translate('gomoku.cell.last')}` : position
}

export function GomokuGame({ phase, runId, variantId, updateHud, finish, translate }: GameViewProps) {
  const boardElement = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const turnRef = useRef<typeof PLAYER | typeof AI>(PLAYER)
  const focusIndexRef = useRef(CENTER)
  const boardRef = useRef<readonly Stone[]>(createBoard())
  const movesRef = useRef(0)
  const ended = useRef(false)
  const [board, setBoard] = useState(boardRef.current)
  const [turn, setTurn] = useState<typeof PLAYER | typeof AI>(PLAYER)
  const [lastMove, setLastMove] = useState<number | null>(null)
  const [winningLine, setWinningLine] = useState<readonly number[] | null>(null)
  const [focusIndex, setFocusIndex] = useState(CENTER)

  useEffect(() => {
    const empty = createBoard()
    boardRef.current = empty
    movesRef.current = 0
    ended.current = false
    turnRef.current = PLAYER
    focusIndexRef.current = CENTER
    setBoard(empty)
    setTurn(PLAYER)
    setLastMove(null)
    setWinningLine(null)
    setFocusIndex(CENTER)
    updateHud({ primary: { id: 'moves', value: 0 }, statusKey: 'gomoku.turn.player' })
  }, [runId, updateHud])

  const commitMove = useCallback((index: number, stone: typeof PLAYER | typeof AI) => {
    if (phaseRef.current !== 'running' || ended.current || turnRef.current !== stone) return false
    const next = placeStone(boardRef.current, index, stone)
    if (next === null) return false

    const nextMoves = movesRef.current + 1
    const line = findWinningLine(next, index)
    if (line !== null) {
      updateHud({ primary: { id: 'moves', value: nextMoves } })
      if (!finish({ outcome: stone === PLAYER ? 'won' : 'lost', metrics: { moves: nextMoves } })) return false
      ended.current = true
      setWinningLine(line)
    } else if (isBoardFull(next)) {
      updateHud({ primary: { id: 'moves', value: nextMoves } })
      if (!finish({ outcome: 'draw', metrics: { moves: nextMoves } })) return false
      ended.current = true
    }

    boardRef.current = next
    movesRef.current = nextMoves
    setBoard(next)
    setLastMove(index)

    if (line !== null || isBoardFull(next)) {
      return true
    }

    updateHud({ primary: { id: 'moves', value: nextMoves } })

    const nextTurn = stone === PLAYER ? AI : PLAYER
    turnRef.current = nextTurn
    setTurn(nextTurn)
    updateHud({ statusKey: nextTurn === PLAYER ? 'gomoku.turn.player' : 'gomoku.turn.ai' })
    return true
  }, [finish, updateHud])

  useEffect(() => {
    if (phase !== 'running' || turn !== AI || ended.current) return
    const difficulty = difficultyFromVariant(variantId)
    const timeout = window.setTimeout(() => {
      const move = chooseAiMove(boardRef.current, difficulty)
      if (move !== null) commitMove(move, AI)
    }, aiDelay(difficulty))
    return () => { window.clearTimeout(timeout) }
  }, [commitMove, phase, turn, variantId])

  const focusCell = useCallback((index: number) => {
    focusIndexRef.current = index
    setFocusIndex(index)
    boardElement.current?.querySelector<HTMLButtonElement>(`[data-index="${index}"]`)?.focus()
  }, [])

  useEffect(() => {
    if (phase === 'running') focusCell(focusIndexRef.current)
  }, [focusCell, phase, runId])

  const winning = new Set(winningLine ?? [])

  return <div className={styles.ocean} data-whale-game data-gomoku-phase={phase}>
    <div className={styles.light} aria-hidden="true"/>
    <div
      className={styles.turnStatus}
      data-gomoku-turn={turn === PLAYER ? 'player' : 'ai'}
      data-turn={turn === PLAYER ? 'player' : 'ai'}
      data-thinking={phase === 'running' && turn === AI || undefined}
      role="status"
      aria-live="polite"
      aria-label={translate(turn === PLAYER ? 'gomoku.turn.player' : 'gomoku.turn.ai')}
    >
      <span className={`${styles.statusWhale} ${styles.statusPlayer}`}><WhaleStone side="player"/></span>
      <span className={styles.turnTide} aria-hidden="true"><i/><i/><i/></span>
      <span className={`${styles.statusWhale} ${styles.statusAi}`}><WhaleStone side="ai"/></span>
    </div>
    <div
      ref={boardElement}
      className={styles.board}
      role="grid"
      aria-label={translate('gomoku.board')}
      aria-rowcount={GOMOKU_SIZE}
      aria-colcount={GOMOKU_SIZE}
      aria-busy={phase === 'running' && turn === AI}
    >
      {Array.from({ length: GOMOKU_SIZE }, (_, row) => <div className={styles.row} role="row" key={row}>
        {Array.from({ length: GOMOKU_SIZE }, (_, column) => {
          const index = row * GOMOKU_SIZE + column
          const stone = board[index] ?? EMPTY
          const isLast = lastMove === index
          const playable = phase === 'running' && turn === PLAYER && stone === EMPTY
          return <button
            type="button"
            role="gridcell"
            key={index}
            className={styles.cell}
            data-index={index}
            data-star={STAR_POINTS.has(index) || undefined}
            data-last={isLast || undefined}
            data-winning={winning.has(index) || undefined}
            data-playable={playable || undefined}
            data-stone={stone === PLAYER ? 'player' : stone === AI ? 'ai' : undefined}
            aria-label={cellLabel(translate, index, stone, isLast)}
            aria-rowindex={row + 1}
            aria-colindex={column + 1}
            aria-current={isLast || undefined}
            aria-disabled={!playable}
            tabIndex={focusIndex === index ? 0 : -1}
            onFocus={() => {
              focusIndexRef.current = index
              setFocusIndex(index)
            }}
            onClick={() => {
              if (playable) commitMove(index, PLAYER)
            }}
            onKeyDown={(event) => {
              const offsets: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -GOMOKU_SIZE, ArrowDown: GOMOKU_SIZE }
              const offset = offsets[event.key]
              if (offset === undefined) return
              const target = index + offset
              const targetPoint = toPoint(target)
              if (target >= 0 && target < GOMOKU_CELLS && (Math.abs(offset) !== 1 || targetPoint.row === row)) focusCell(target)
              event.preventDefault()
            }}
          >
            {stone !== EMPTY && <span className={styles.piece}><WhaleStone side={stone === PLAYER ? 'player' : 'ai'}/></span>}
          </button>
        })}
      </div>)}
    </div>
    <div className={styles.waves} aria-hidden="true"><i/><i/></div>
  </div>
}
