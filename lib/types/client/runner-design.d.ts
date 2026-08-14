import type { RunnerObstacleKind, RunnerObstacleModel } from './runner-physics.ts';
export type RunnerGapBand = 'short' | 'medium' | 'long';
export type RunnerStage = 'intro' | 'mixed' | 'advanced';
export interface RunnerHistory {
    /** One primary kind per previously generated wave, oldest to newest. */
    recentKinds?: readonly RunnerObstacleKind[];
    /** One band per previously generated wave, oldest to newest. */
    recentGapBands?: readonly RunnerGapBand[];
}
export interface RunnerSpawn extends RunnerObstacleModel {
    /** Trailing-center to next-wave-center distance, expressed as viewport percent. */
    gapAfter: number;
}
export interface RunnerWave {
    obstacles: RunnerSpawn[];
    primaryKind: RunnerObstacleKind;
    gapBand: RunnerGapBand;
    gapAfter: number;
    reactionSeconds: number;
}
interface Range {
    min: number;
    max: number;
}
export declare function runnerSpeed(elapsedSeconds: number): number;
export declare function runnerStage(elapsedSeconds: number): RunnerStage;
export declare function runnerGapRange(elapsedSeconds: number, band: RunnerGapBand): Range;
/** Generate one obstacle wave with staged variety and a reaction-time-derived spatial gap. */
export declare function createRunnerWave(elapsedSeconds: number, speed: number, history?: RunnerHistory, random?: () => number): RunnerWave;
export {};
//# sourceMappingURL=runner-design.d.ts.map