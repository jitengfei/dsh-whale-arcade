// @vitest-environment jsdom
import type { ComponentProps } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WhaleArcade } from '../src/client/WhaleArcade.tsx'
import { recordHighScore } from '../src/client/runtime/records.ts'

const props = { t: (key: string) => key } as unknown as ComponentProps<typeof WhaleArcade>

describe('WhaleArcade UI state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it('keeps the current game component mounted while its overlay is closed', () => {
    const view = render(<WhaleArcade {...props}/>)
    fireEvent.click(screen.getByRole('button', { name: 'launcher' }))
    fireEvent.click(screen.getByRole('button', { name: /jump\.name.*jump\.desc/ }))
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    const board = screen.getByRole('button', { name: 'Whale wave game' })

    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(screen.getByRole('dialog', { hidden: true }).hidden).toBe(true)
    expect(board.isConnected).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'launcher' }))
    expect(screen.getByRole('button', { name: 'Whale wave game' })).toBe(board)
    expect(view.container.querySelector('[data-phase="paused"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'resume' })).not.toBeNull()
  })

  it('pauses an active round when the browser tab becomes hidden', () => {
    render(<WhaleArcade {...props}/>)
    fireEvent.click(screen.getByRole('button', { name: 'launcher' }))
    fireEvent.click(screen.getByRole('button', { name: /jump\.name.*jump\.desc/ }))
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)

    fireEvent(document, new Event('visibilitychange'))

    expect(document.querySelector('[data-phase="paused"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'resume' })).not.toBeNull()
  })

  it('renders a selectable local top-ten table in the catalog', () => {
    for (let index = 0; index < 12; index += 1) recordHighScore('jump', { score: index, durationMs: 1_000 + index, achievedAt: index })
    render(<WhaleArcade {...props}/>)
    fireEvent.click(screen.getByRole('button', { name: 'launcher' }))

    const leaderboard = screen.getByRole('region', { name: 'leaderboard' })
    expect(within(leaderboard).getAllByRole('listitem')).toHaveLength(10)
    expect(within(leaderboard).getByLabelText('score 11')).not.toBeNull()
    fireEvent.click(within(leaderboard).getByRole('button', { name: 'catch.name' }))
    expect(within(leaderboard).getByText('empty')).not.toBeNull()
  })

  it('plays one ocean gomoku turn at the selected difficulty', async () => {
    vi.useFakeTimers()
    render(<WhaleArcade {...props}/>)
    fireEvent.click(screen.getByRole('button', { name: 'launcher' }))
    fireEvent.click(screen.getByRole('button', { name: /gomoku\.name.*gomoku\.desc/ }))
    fireEvent.click(screen.getByRole('button', { name: 'gomoku.difficulty.easy' }))
    expect(screen.getByRole('button', { name: 'gomoku.difficulty.easy' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'play' }))

    const board = screen.getByRole('grid', { name: 'gomoku.board' })
    expect(within(board).getAllByRole('row')).toHaveLength(15)
    const center = within(board).getAllByRole('gridcell', { name: 'gomoku.cell.empty' })[112]
    expect(center).toBeDefined()
    if (center === undefined) throw new Error('Missing center gomoku cell')
    expect(center.tabIndex).toBe(0)
    expect(document.activeElement).toBe(center)
    fireEvent.click(center)
    expect(document.querySelectorAll('[data-stone="player"]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-stone="ai"]')).toHaveLength(0)
    expect(document.querySelector('[data-gomoku-turn="ai"]')).not.toBeNull()
    expect(center.getAttribute('aria-current')).toBe('true')

    fireEvent.keyDown(center, { key: 'ArrowRight' })
    const right = center.parentElement?.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')[8]
    expect(right).toBeDefined()
    expect(document.activeElement).toBe(right)
    expect(right?.getAttribute('aria-disabled')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'pause' }))
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(document.querySelectorAll('[data-stone="ai"]')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'resume' }))
    await act(async () => { vi.advanceTimersByTime(200) })
    expect(document.querySelectorAll('[data-stone="ai"]')).toHaveLength(1)
    expect(screen.getByText('gomoku.turn.player')).not.toBeNull()
    expect(document.querySelector('[data-gomoku-turn="player"]')).not.toBeNull()
    expect(document.activeElement).toBe(right)
    expect(document.querySelectorAll('[data-whale-stone="player"]')).toHaveLength(2)
    expect(document.querySelectorAll('[data-whale-stone="ai"]')).toHaveLength(2)
  })
})
