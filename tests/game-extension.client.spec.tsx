// @vitest-environment jsdom
import type { ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GAMES, type ArcadeGameDefinition } from '../src/client/game-registry.ts'
import { useGameSession } from '../src/client/runtime/use-game-session.ts'
import { HIGH_SCORE_POLICY, NO_RECORD_POLICY, readGameRecords, recordGameResult } from '../src/client/runtime/records.ts'
import { GameFrame } from '../src/client/shell/GameFrame.tsx'

const t = ((key: string) => key) as ComponentProps<typeof GameFrame>['t']

const versusGame: ArcadeGameDefinition = {
  id: 'ocean-board-test',
  nameKey: 'jump.name',
  descriptionKey: 'jump.desc',
  Icon: () => null,
  Setup: ({ variantId, selectVariant }) => <button type="button" onClick={() => { selectVariant('hard-first') }}>
    {variantId === 'hard-first' ? 'hard selected' : 'choose hard'}
  </button>,
  View: ({ finish, variantId }) => <div>
    <span>variant {variantId}</span>
    <button type="button" onClick={() => { finish({ outcome: 'won', metrics: { moves: 9 } }) }}>finish match</button>
  </div>,
  defaultVariantId: 'easy-first',
  initialHud: { primary: { id: 'moves', labelKey: 'moves', value: 0 }, statusKey: 'jump.desc' },
  recordPolicy: NO_RECORD_POLICY,
}

const rankedVersusGame: ArcadeGameDefinition = {
  ...versusGame,
  id: 'ranked-ocean-board-test',
  View: ({ finish, variantId }) => <div>
    <span>ranked variant {variantId}</span>
    <button type="button" onClick={() => { finish({ outcome: 'won', metrics: { score: 9 } }) }}>finish ranked match</button>
  </div>,
  initialHud: { primary: { id: 'score', labelKey: 'score', value: 0 } },
  recordPolicy: HIGH_SCORE_POLICY,
}

function ScorelessGameFrame() {
  const session = useGameSession({
    initialHud: versusGame.initialHud ?? {},
    ...(versusGame.defaultVariantId === undefined ? {} : { initialVariantId: versusGame.defaultVariantId }),
  })
  return <GameFrame definition={versusGame} session={session} onBack={() => {}} onClose={() => {}} t={t}/>
}

function RankedGameFrame() {
  const session = useGameSession({
    initialHud: rankedVersusGame.initialHud ?? {},
    ...(rankedVersusGame.defaultVariantId === undefined ? {} : { initialVariantId: rankedVersusGame.defaultVariantId }),
    onFinish: (completed) => {
      recordGameResult(rankedVersusGame.id, rankedVersusGame.recordPolicy, {
        result: completed.result,
        durationMs: completed.durationMs,
      })
    },
  })
  return <GameFrame definition={rankedVersusGame} session={session} onBack={() => {}} onClose={() => {}} t={t}/>
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('game extension contract', () => {
  it('keeps one unique ordered registry for every catalog game', () => {
    expect(GAMES.map(game => game.id)).toEqual(['jump', 'catch', 'runner', 'gomoku'])
    expect(new Set(GAMES.map(game => game.id)).size).toBe(GAMES.length)
    expect(GAMES.every(game => typeof game.View === 'function' && typeof game.Icon === 'function')).toBe(true)
  })

  it('hosts a scoreless player-versus-AI result without forcing a leaderboard', () => {
    render(<ScorelessGameFrame/>)
    expect(screen.getByText('moves')).not.toBeNull()
    expect(screen.queryByText('score')).toBeNull()
    expect(screen.queryByText('best')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'choose hard' }))
    expect(screen.getByText('variant hard-first')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    fireEvent.click(screen.getByRole('button', { name: 'finish match' }))

    expect(screen.getByText('result.won')).not.toBeNull()
    expect(document.querySelector('[data-phase="finished"]')).not.toBeNull()
    expect(screen.queryByText('best')).toBeNull()
  })

  it('keeps the selected variant through finish, ranking, and restart', () => {
    render(<RankedGameFrame/>)
    fireEvent.click(screen.getByRole('button', { name: 'choose hard' }))
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    fireEvent.click(screen.getByRole('button', { name: 'finish ranked match' }))

    expect(readGameRecords(rankedVersusGame.id, HIGH_SCORE_POLICY, localStorage, 'hard-first')).toHaveLength(1)
    expect(screen.getByText('00009')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'restart' }))
    expect(screen.getByText('ranked variant hard-first')).not.toBeNull()
  })
})
