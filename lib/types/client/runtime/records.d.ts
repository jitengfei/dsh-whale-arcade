import type { RunOutcome, RunResult } from './game-contract.ts';
export declare const RECORDS_STORAGE_KEY = "dsh.whale-arcade.records.v2";
export declare const LEGACY_SCORES_STORAGE_KEY = "dsh.whale-arcade.scores.v1";
export interface StorageLike {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
}
export interface GameRecord {
    readonly outcome: RunOutcome;
    readonly metrics: Readonly<Record<string, number>>;
    readonly variantId?: string;
    readonly durationMs: number;
    readonly achievedAt: number;
}
export interface GameResultRecordInput {
    readonly result: RunResult;
    readonly durationMs: number;
    readonly achievedAt?: number;
}
export type SortDirection = 'asc' | 'desc';
export type RecordRankingRule = {
    readonly field: 'metric';
    readonly metricId: string;
    readonly direction: SortDirection;
} | {
    readonly field: 'durationMs' | 'achievedAt';
    readonly direction: SortDirection;
};
interface BaseRecordPolicy {
    readonly limit?: number;
    readonly outcomes?: readonly RunOutcome[];
}
export interface LeaderboardRecordPolicy extends BaseRecordPolicy {
    readonly kind: 'leaderboard';
    readonly rankBy: readonly RecordRankingRule[];
}
export interface HistoryRecordPolicy extends BaseRecordPolicy {
    readonly kind: 'history';
}
export interface NoRecordPolicy {
    readonly kind: 'none';
}
export type RecordPolicy = LeaderboardRecordPolicy | HistoryRecordPolicy | NoRecordPolicy;
/** Matches the original arcade ordering: score, active duration, timestamp. */
export declare const HIGH_SCORE_POLICY: {
    readonly kind: "leaderboard";
    readonly limit: 10;
    readonly rankBy: readonly [{
        readonly field: "metric";
        readonly metricId: "score";
        readonly direction: "desc";
    }, {
        readonly field: "durationMs";
        readonly direction: "asc";
    }, {
        readonly field: "achievedAt";
        readonly direction: "asc";
    }];
};
export declare const NO_RECORD_POLICY: {
    readonly kind: "none";
};
export interface ScoreEntry {
    readonly score: number;
    readonly durationMs: number;
    readonly achievedAt: number;
}
/** Read normalized records without letting unavailable browser storage escape. */
export declare function readGameRecords(gameId: string, policy: RecordPolicy, storage?: StorageLike | null, variantId?: string): GameRecord[];
/** Insert a completed run; unrelated and unknown game entries remain untouched. */
export declare function recordGameResult(gameId: string, policy: RecordPolicy, input: GameResultRecordInput, storage?: StorageLike | null): GameRecord[];
/** Compatibility adapter for the three original score-based games. */
export declare function readHighScores(gameId: string, storage?: StorageLike | null): ScoreEntry[];
/** Compatibility adapter with the same input and ordering as `recordScore`. */
export declare function recordHighScore(gameId: string, entry: ScoreEntry, storage?: StorageLike | null): ScoreEntry[];
export {};
