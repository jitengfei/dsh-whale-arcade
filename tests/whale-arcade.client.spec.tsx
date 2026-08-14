// @vitest-environment jsdom
import type { ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WhaleArcade } from '../src/client/WhaleArcade.tsx'
import { recordScore } from '../src/client/leaderboard.ts'

const props = { t: (key: string) => key } as unknown as ComponentProps<typeof WhaleArcade>

describe('WhaleArcade UI state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

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
    for (let index = 0; index < 12; index += 1) recordScore('jump', { score: index, durationMs: 1_000 + index, achievedAt: index })
    render(<WhaleArcade {...props}/>)
    fireEvent.click(screen.getByRole('button', { name: 'launcher' }))

    const leaderboard = screen.getByRole('region', { name: 'leaderboard' })
    expect(within(leaderboard).getAllByRole('listitem')).toHaveLength(10)
    expect(within(leaderboard).getByLabelText('score 11')).not.toBeNull()
    fireEvent.click(within(leaderboard).getByRole('button', { name: 'catch.name' }))
    expect(within(leaderboard).getByText('empty')).not.toBeNull()
  })
})
