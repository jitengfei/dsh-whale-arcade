import { createActiveTimer, type Now } from './active-timer.ts'
import type { GameHud, GameHudUpdate, GameResult, HudMetric, RunPhase, RunResult } from './game-contract.ts'

const EMPTY_HUD: GameHud = {}

export interface CompletedRun {
  readonly runId: number
  readonly result: RunResult
  readonly durationMs: number
}

export interface GameSessionState {
  readonly phase: RunPhase
  readonly runId: number
  readonly variantId: string | undefined
  readonly hud: GameHud
  readonly result: RunResult | null
  /** Last captured duration. Use `readDurationMs` for a live running value. */
  readonly durationMs: number
}

export interface GameSessionOptions {
  readonly initialHud?: GameHud
  readonly initialVariantId?: string
  readonly now?: Now
  readonly onFinish?: (completed: CompletedRun) => void
}

export interface GamePreparation {
  readonly initialHud?: GameHud
  readonly variantId?: string
}

export interface GameSession {
  getState: () => GameSessionState
  subscribe: (listener: () => void) => () => void
  start: () => boolean
  pause: () => boolean
  resume: () => boolean
  restart: () => void
  finish: (runId: number, result: GameResult) => CompletedRun | null
  prepare: (preparation?: GamePreparation) => void
  selectVariant: (variantId: string) => boolean
  abandon: () => void
  updateHud: (runId: number, next: GameHudUpdate) => boolean
  readDurationMs: () => number
}

/**
 * Framework-agnostic one-round controller. All operations are synchronous so a
 * game-over callback can record the exact completed duration immediately.
 */
export function createGameSession(options: GameSessionOptions = {}): GameSession {
  let initialHud = options.initialHud ?? EMPTY_HUD
  let initialVariantId = options.initialVariantId
  const timer = createActiveTimer(options.now)
  const listeners = new Set<() => void>()
  let state: GameSessionState = {
    phase: 'ready',
    runId: 0,
    variantId: initialVariantId,
    hud: initialHud,
    result: null,
    durationMs: 0,
  }

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const replace = (next: GameSessionState) => {
    state = next
    emit()
  }

  const mergeMetric = (current: HudMetric | undefined, next: HudMetric | null | undefined) => {
    if (next === null) return undefined
    if (next === undefined) return current
    return { ...current, ...next }
  }

  const mergeHud = (current: GameHud, next: GameHudUpdate): GameHud => {
    const primary = mergeMetric(current.primary, next.primary)
    const secondary = mergeMetric(current.secondary, next.secondary)
    const statusKey = next.statusKey === null ? undefined : (next.statusKey ?? current.statusKey)
    return {
      ...(primary === undefined ? {} : { primary }),
      ...(secondary === undefined ? {} : { secondary }),
      ...(statusKey === undefined ? {} : { statusKey }),
    }
  }

  const begin = () => {
    timer.start()
    replace({
      phase: 'running',
      runId: state.runId + 1,
      variantId: state.variantId,
      hud: initialHud,
      result: null,
      durationMs: 0,
    })
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start() {
      if (state.phase !== 'ready') return false
      begin()
      return true
    },
    pause() {
      if (state.phase !== 'running') return false
      const durationMs = timer.pause()
      replace({ ...state, phase: 'paused', durationMs })
      return true
    },
    resume() {
      if (state.phase !== 'paused') return false
      timer.resume()
      replace({ ...state, phase: 'running' })
      return true
    },
    restart: begin,
    finish(runId, result) {
      if (state.phase !== 'running' || runId !== state.runId) return null
      const durationMs = timer.pause()
      const resolvedResult: RunResult = state.variantId === undefined ? result : { ...result, variantId: state.variantId }
      const completed: CompletedRun = { runId, result: resolvedResult, durationMs }
      replace({ ...state, phase: 'finished', result: resolvedResult, durationMs })
      options.onFinish?.(completed)
      return completed
    },
    prepare(preparation = {}) {
      timer.reset()
      initialHud = preparation.initialHud ?? EMPTY_HUD
      initialVariantId = preparation.variantId
      replace({
        phase: 'ready',
        runId: state.runId + 1,
        variantId: initialVariantId,
        hud: initialHud,
        result: null,
        durationMs: 0,
      })
    },
    abandon() {
      timer.reset()
      replace({
        phase: 'ready',
        runId: state.runId + 1,
        variantId: initialVariantId,
        hud: initialHud,
        result: null,
        durationMs: 0,
      })
    },
    selectVariant(variantId) {
      if (state.phase !== 'ready') return false
      replace({ ...state, variantId })
      return true
    },
    updateHud(runId, next) {
      if (state.phase !== 'running' || runId !== state.runId) return false
      replace({ ...state, hud: mergeHud(state.hud, next) })
      return true
    },
    readDurationMs: () => timer.read(),
  }
}
