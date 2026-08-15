import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import type { GameHudUpdate, GameResult, GameRuntimeProps } from './game-contract.ts'
import {
  createGameSession,
  type CompletedRun,
  type GamePreparation,
  type GameSession,
  type GameSessionOptions,
  type GameSessionState,
} from './game-session.ts'

export interface UseGameSessionOptions extends Omit<GameSessionOptions, 'onFinish'> {
  readonly onFinish?: (completed: CompletedRun) => void
}

export interface GameSessionBinding {
  readonly state: GameSessionState
  readonly runtime: GameRuntimeProps
  readonly session: GameSession
  readonly start: () => boolean
  readonly pause: () => boolean
  readonly resume: () => boolean
  readonly restart: () => void
  readonly prepare: (preparation?: GamePreparation) => void
  readonly selectVariant: (variantId: string) => boolean
  readonly abandon: () => void
  readonly readDurationMs: () => number
}

/** React binding for `createGameSession`; options seed one mounted game session. */
export function useGameSession(options: UseGameSessionOptions = {}): GameSessionBinding {
  const onFinishRef = useRef(options.onFinish)
  onFinishRef.current = options.onFinish

  const [session] = useState(() => {
    const controllerOptions: GameSessionOptions = {
      ...(options.initialHud === undefined ? {} : { initialHud: options.initialHud }),
      ...(options.initialVariantId === undefined ? {} : { initialVariantId: options.initialVariantId }),
      ...(options.now === undefined ? {} : { now: options.now }),
      onFinish: completed => onFinishRef.current?.(completed),
    }
    return createGameSession(controllerOptions)
  })
  const state = useSyncExternalStore(session.subscribe, session.getState, session.getState)

  const updateHud = useCallback((next: GameHudUpdate) => {
    session.updateHud(state.runId, next)
  }, [session, state.runId])
  const finish = useCallback((result: GameResult) => (
    session.finish(state.runId, result) !== null
  ), [session, state.runId])

  return {
    state,
    runtime: {
      phase: state.phase,
      runId: state.runId,
      variantId: state.variantId,
      hud: state.hud,
      updateHud,
      finish,
    },
    session,
    start: session.start,
    pause: session.pause,
    resume: session.resume,
    restart: session.restart,
    prepare: session.prepare,
    selectVariant: session.selectVariant,
    abandon: session.abandon,
    readDurationMs: session.readDurationMs,
  }
}
