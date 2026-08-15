import type { GameIconProps } from '../../runtime/game-contract.ts';
import { CatchGame } from './CatchGame.tsx';
declare function CatchIcon({ className }: GameIconProps): import("react").JSX.Element;
export declare const catchGame: {
    readonly id: "catch";
    readonly nameKey: "catch.name";
    readonly descriptionKey: "catch.desc";
    readonly Icon: typeof CatchIcon;
    readonly View: typeof CatchGame;
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
