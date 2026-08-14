export type GameId = 'jump' | 'catch' | 'runner';
export interface ScoreEntry {
    score: number;
    durationMs: number;
    achievedAt: number;
}
/** Read the ten highest scores for one game. */
export declare function readScores(game: GameId): ScoreEntry[];
/** Insert a completed score and return the newly ordered table. */
export declare function recordScore(game: GameId, entry: ScoreEntry): ScoreEntry[];
//# sourceMappingURL=leaderboard.d.ts.map