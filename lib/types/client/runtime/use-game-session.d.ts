import type { GameRuntimeProps } from './game-contract.ts';
import { type CompletedRun, type GamePreparation, type GameSession, type GameSessionOptions, type GameSessionState } from './game-session.ts';
export interface UseGameSessionOptions extends Omit<GameSessionOptions, 'onFinish'> {
    readonly onFinish?: (completed: CompletedRun) => void;
}
export interface GameSessionBinding {
    readonly state: GameSessionState;
    readonly runtime: GameRuntimeProps;
    readonly session: GameSession;
    readonly start: () => boolean;
    readonly pause: () => boolean;
    readonly resume: () => boolean;
    readonly restart: () => void;
    readonly prepare: (preparation?: GamePreparation) => void;
    readonly selectVariant: (variantId: string) => boolean;
    readonly abandon: () => void;
    readonly readDurationMs: () => number;
}
/** React binding for `createGameSession`; options seed one mounted game session. */
export declare function useGameSession(options?: UseGameSessionOptions): GameSessionBinding;
