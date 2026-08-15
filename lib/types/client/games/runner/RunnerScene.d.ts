import type { SplashState } from '../../shared/Splash.tsx';
import { type RunnerObstacleModel } from './physics.ts';
export interface RunnerObstacle extends RunnerObstacleModel {
    id: number;
    gapAfter: number;
}
export interface RunnerSceneProps {
    whaleY: number;
    obstacles: RunnerObstacle[];
    splash: SplashState | null;
}
export declare function RunnerScene({ whaleY, obstacles, splash }: RunnerSceneProps): import("react").JSX.Element;
