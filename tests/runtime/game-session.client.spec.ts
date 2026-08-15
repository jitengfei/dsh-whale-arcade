import { describe, expect, it, vi } from 'vitest'
import { createGameSession } from '../../src/client/runtime/game-session.ts'

const SCORE_RESULT = { outcome: 'failed', metrics: { score: 12 } } as const

describe('game session controller', () => {
  it('moves through ready, running, paused, resumed, and finished states', () => {
    let now = 100
    const onFinish = vi.fn()
    const session = createGameSession({
      initialHud: { primary: { id: 'score', value: 0 } },
      now: () => now,
      onFinish,
    })

    expect(session.getState()).toMatchObject({ phase: 'ready', runId: 0, durationMs: 0 })
    expect(session.start()).toBe(true)
    expect(session.start()).toBe(false)
    const runId = session.getState().runId

    now = 400
    expect(session.updateHud(runId, { primary: { id: 'score', value: 8 } })).toBe(true)
    expect(session.pause()).toBe(true)
    expect(session.getState()).toMatchObject({ phase: 'paused', durationMs: 300 })

    now = 10_000
    expect(session.readDurationMs()).toBe(300)
    expect(session.resume()).toBe(true)
    now = 10_125

    const completed = session.finish(runId, SCORE_RESULT)
    expect(completed).toEqual({ runId, result: SCORE_RESULT, durationMs: 425 })
    expect(session.getState()).toMatchObject({ phase: 'finished', durationMs: 425 })
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('accepts finish only once and rejects stale run callbacks', () => {
    let now = 0
    const onFinish = vi.fn()
    const session = createGameSession({ now: () => now, onFinish })
    session.start()
    const firstRun = session.getState().runId
    now = 20

    expect(session.finish(firstRun, SCORE_RESULT)).not.toBeNull()
    expect(session.finish(firstRun, SCORE_RESULT)).toBeNull()
    session.restart()
    const secondRun = session.getState().runId

    expect(secondRun).toBeGreaterThan(firstRun)
    expect(session.finish(firstRun, SCORE_RESULT)).toBeNull()
    expect(session.updateHud(firstRun, { primary: { id: 'score', value: 99 } })).toBe(false)
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('rejects a paused finish without preventing a later resumed finish', () => {
    const session = createGameSession({ now: () => 20 })
    session.start()
    const runId = session.getState().runId
    session.pause()

    expect(session.finish(runId, SCORE_RESULT)).toBeNull()
    expect(session.resume()).toBe(true)
    expect(session.finish(runId, SCORE_RESULT)).not.toBeNull()
  })

  it('abandons without completing and invalidates the current run', () => {
    const onFinish = vi.fn()
    const session = createGameSession({ now: () => 50, onFinish })
    session.start()
    const abandonedRun = session.getState().runId

    session.abandon()

    expect(session.getState()).toMatchObject({ phase: 'ready', result: null, durationMs: 0 })
    expect(session.finish(abandonedRun, SCORE_RESULT)).toBeNull()
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('prepares a different game with its own initial HUD', () => {
    const session = createGameSession({ initialHud: { primary: { id: 'score', value: 0 } } })
    session.start()
    const previousRun = session.getState().runId

    session.prepare({ initialHud: { primary: { id: 'moves', value: 0 } } })
    expect(session.getState()).toMatchObject({
      phase: 'ready',
      hud: { primary: { id: 'moves', value: 0 } },
      result: null,
      durationMs: 0,
    })
    session.start()
    expect(session.getState().hud).toEqual({ primary: { id: 'moves', value: 0 } })
    expect(session.finish(previousRun, SCORE_RESULT)).toBeNull()
  })

  it('locks a selected rule variant into the completed run', () => {
    const session = createGameSession({ initialVariantId: 'easy-first' })
    expect(session.getState().variantId).toBe('easy-first')
    expect(session.selectVariant('hard-second')).toBe(true)

    session.start()
    const runId = session.getState().runId
    expect(session.selectVariant('easy-first')).toBe(false)
    expect(session.finish(runId, { outcome: 'won', metrics: { moves: 14 } })?.result).toEqual({
      outcome: 'won',
      metrics: { moves: 14 },
      variantId: 'hard-second',
    })
  })

  it('merges HUD updates so turn status and metric labels survive independently', () => {
    const session = createGameSession({
      initialHud: {
        primary: { id: 'moves', labelKey: 'moves', value: 0 },
        statusKey: 'jump.desc',
      },
    })
    session.start()
    const runId = session.getState().runId

    session.updateHud(runId, { primary: { id: 'moves', value: 4 } })
    expect(session.getState().hud).toEqual({
      primary: { id: 'moves', labelKey: 'moves', value: 4 },
      statusKey: 'jump.desc',
    })
    session.updateHud(runId, { statusKey: null })
    expect(session.getState().hud).toEqual({
      primary: { id: 'moves', labelKey: 'moves', value: 4 },
    })
  })
})
