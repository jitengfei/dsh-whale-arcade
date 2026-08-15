import type { GameIconProps } from '../../runtime/game-contract.ts';
import { JumpGame } from './JumpGame.tsx';
declare function JumpIcon({ className }: GameIconProps): import("react").JSX.Element;
export declare const jumpGame: {
    readonly id: "jump";
    readonly nameKey: "jump.name";
    readonly descriptionKey: "jump.desc";
    readonly Icon: typeof JumpIcon;
    readonly View: typeof JumpGame;
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
