import type { ComponentType } from 'react'
import type { WhaleArcadeKey } from '../locales.ts'

/** Lifecycle shared by every game, regardless of its scoring model. */
export type RunPhase = 'ready' | 'running' | 'paused' | 'finished'

/** A neutral result model also works for puzzles and player-versus-AI games. */
export type RunOutcome = 'completed' | 'failed' | 'won' | 'lost' | 'draw'

/** Result supplied by a game; rule identity is owned by the session. */
export interface GameResult {
  readonly outcome: RunOutcome
  readonly metrics: Readonly<Record<string, number>>
}

/** Completed result after the session attaches its locked rule identity. */
export interface RunResult extends GameResult {
  /** Keeps records from different difficulties or rule sets separate. */
  readonly variantId?: string
}

export interface HudMetric {
  readonly id: string
  readonly value: number
  readonly labelKey?: WhaleArcadeKey
}

/** The shell deliberately owns only two quiet, numeric status slots. */
export interface GameHud {
  readonly primary?: HudMetric
  readonly secondary?: HudMetric
  /** Optional quiet status such as the current turn or local AI thinking. */
  readonly statusKey?: WhaleArcadeKey
}

/** A partial HUD change; null explicitly removes an optional slot. */
export interface GameHudUpdate {
  readonly primary?: HudMetric | null
  readonly secondary?: HudMetric | null
  readonly statusKey?: WhaleArcadeKey | null
}

export interface GameRuntimeProps {
  readonly phase: RunPhase
  readonly runId: number
  /** Active difficulty/rule-set identity selected before this run. */
  readonly variantId: string | undefined
  readonly hud: GameHud
  readonly updateHud: (next: GameHudUpdate) => void
  /** Returns false when a stale or already-completed run tries to finish. */
  readonly finish: (result: GameResult) => boolean
}

/** Runtime props plus the owning arcade namespace translator. */
export interface GameViewProps extends GameRuntimeProps {
  readonly translate: (key: WhaleArcadeKey, params?: Record<string, unknown>) => string
}

export interface GameIconProps {
  readonly className?: string
}

/** Optional, game-owned controls rendered before the shell starts a run. */
export interface GameSetupProps {
  readonly variantId: string | undefined
  readonly selectVariant: (variantId: string) => boolean
  readonly translate: (key: WhaleArcadeKey) => string
}

/**
 * Static, compile-time game registration contract.
 *
 * The record policy is generic so this low-level UI contract does not depend on
 * storage. A registry can bind it to `RecordPolicy` from `records.ts`.
 */
export interface GameDefinition<TId extends string = string, TRecordPolicy = unknown> {
  readonly id: TId
  readonly nameKey: WhaleArcadeKey
  readonly descriptionKey: WhaleArcadeKey
  readonly Icon: ComponentType<GameIconProps>
  readonly View: ComponentType<GameViewProps>
  readonly Setup?: ComponentType<GameSetupProps>
  readonly initialHud?: GameHud
  /** Initial difficulty/rule set. More settings can be encoded by the game. */
  readonly defaultVariantId?: string
  readonly recordPolicy?: TRecordPolicy
  readonly recordLabelKey?: WhaleArcadeKey
}
