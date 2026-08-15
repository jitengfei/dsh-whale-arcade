import { type Now } from './active-timer.ts';
import type { GameHud, GameHudUpdate, GameResult, RunPhase, RunResult } from './game-contract.ts';
export interface CompletedRun {
    readonly runId: number;
    readonly result: RunResult;
    readonly durationMs: number;
}
export interface GameSessionState {
    readonly phase: RunPhase;
    readonly runId: number;
    readonly variantId: string | undefined;
    readonly hud: GameHud;
    readonly result: RunResult | null;
    /** Last captured duration. Use `readDurationMs` for a live running value. */
    readonly durationMs: number;
}
export interface GameSessionOptions {
    readonly initialHud?: GameHud;
    readonly initialVariantId?: string;
    readonly now?: Now;
    readonly onFinish?: (completed: CompletedRun) => void;
}
export interface GamePreparation {
    readonly initialHud?: GameHud;
    readonly variantId?: string;
}
export interface GameSession {
    getState: () => GameSessionState;
    subscribe: (listener: () => void) => () => void;
    start: () => boolean;
    pause: () => boolean;
    resume: () => boolean;
    restart: () => void;
    finish: (runId: number, result: GameResult) => CompletedRun | null;
    prepare: (preparation?: GamePreparation) => void;
    selectVariant: (variantId: string) => boolean;
    abandon: () => void;
    updateHud: (runId: number, next: GameHudUpdate) => boolean;
    readDurationMs: () => number;
}
/**
 * Framework-agnostic one-round controller. All operations are synchronous so a
 * game-over callback can record the exact completed duration immediately.
 */
export declare function createGameSession(options?: GameSessionOptions): GameSession;
