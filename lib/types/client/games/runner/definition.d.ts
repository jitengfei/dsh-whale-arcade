import type { GameIconProps } from '../../runtime/game-contract.ts';
import { RunnerGame } from './RunnerGame.tsx';
declare function RunnerIcon({ className }: GameIconProps): import("react").JSX.Element;
export declare const runnerGame: {
    readonly id: "runner";
    readonly nameKey: "runner.name";
    readonly descriptionKey: "runner.desc";
    readonly Icon: typeof RunnerIcon;
    readonly View: typeof RunnerGame;
    readonly initialHud: {
        readonly primary: {
            readonly id: "score";
            readonly labelKey: "score";
            readonly value: 0;
        };
    };
    readonly recordPolicy: {
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
    readonly recordLabelKey: "score";
};
export {};
