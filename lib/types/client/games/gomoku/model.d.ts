export declare const GOMOKU_SIZE = 15;
export declare const GOMOKU_CELLS: number;
export declare const EMPTY = 0;
export declare const PLAYER = 1;
export declare const AI = 2;
export type Stone = typeof EMPTY | typeof PLAYER | typeof AI;
export type Board = readonly Stone[];
export declare function createBoard(): Stone[];
export declare function toIndex(row: number, column: number): number;
export declare function toPoint(index: number): {
    readonly row: number;
    readonly column: number;
};
export declare function isInside(row: number, column: number): boolean;
export declare function placeStone(board: Board, index: number, stone: Exclude<Stone, typeof EMPTY>): Stone[] | null;
/**
 * Returns one stable five-stone segment through the last move.
 *
 * Whale Arcade uses freestyle Gomoku: a line longer than five also wins. In
 * that case the returned segment is the first five-cell window that still
 * contains the last move, which keeps rendering deterministic.
 */
export declare function findWinningLine(board: Board, index: number): readonly number[] | null;
export declare function hasFive(board: Board, index: number): boolean;
export declare function isBoardFull(board: Board): boolean;
/** Empty intersections near existing stones keep AI work small and moves natural. */
export declare function nearbyMoves(board: Board, radius?: number): number[];
/** Tests a hypothetical freestyle-Gomoku move without copying the board. */
export declare function isWinningMove(board: Board, index: number, stone: Exclude<Stone, typeof EMPTY>): boolean;
export declare function winningMoves(board: Board, stone: Exclude<Stone, typeof EMPTY>): number[];
