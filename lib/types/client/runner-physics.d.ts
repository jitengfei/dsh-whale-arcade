export type RunnerObstacleKind = 'conch' | 'urchin' | 'coral' | 'wreck';
export type RunnerHitShape = {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: 'circle';
    x: number;
    y: number;
    radius: number;
};
export interface RunnerObstacleGeometry {
    visualWidth: number;
    visualHeight: number;
    hitShapes: readonly RunnerHitShape[];
}
/**
 * One geometry source is shared by Canvas drawing and collision detection.
 * Shape coordinates are local to the obstacle's visual top-left corner.
 */
export declare const RUNNER_OBSTACLES: Readonly<Record<RunnerObstacleKind, RunnerObstacleGeometry>>;
export interface RunnerObstacleModel {
    x: number;
    kind: RunnerObstacleKind;
}
/** Friendly collision shapes expressed in the same pixel coordinates as the Canvas scene. */
export declare function runnerCollides(width: number, height: number, whaleY: number, obstacle: RunnerObstacleModel): boolean;
