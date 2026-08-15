import { type Board } from './model.ts';
export type GomokuDifficulty = 'easy' | 'normal' | 'hard';
export declare const GOMOKU_VARIANTS: {
    readonly easy: "gomoku-easy";
    readonly normal: "gomoku-normal";
    readonly hard: "gomoku-hard";
};
export declare function difficultyFromVariant(variantId: string | undefined): GomokuDifficulty;
/** Local AI with shared tactical safety and bounded search by difficulty. */
export declare function chooseAiMove(board: Board, difficulty: GomokuDifficulty, random?: () => number): number | null;
export declare function aiDelay(difficulty: GomokuDifficulty): number;
