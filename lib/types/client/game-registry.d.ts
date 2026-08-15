import type { GameDefinition } from './runtime/game-contract.ts';
import type { RecordPolicy } from './runtime/records.ts';
export type ArcadeGameDefinition = Omit<GameDefinition<string, RecordPolicy>, 'recordPolicy'> & {
    readonly recordPolicy: RecordPolicy;
};
/** Ordered source for catalog cards, game rendering, and record navigation. */
export declare const GAMES: readonly [{
    readonly id: "jump";
    readonly nameKey: "jump.name";
    readonly descriptionKey: "jump.desc";
    readonly Icon: ({ className }: import("./runtime/game-contract.ts").GameIconProps) => import("react").JSX.Element;
    readonly View: typeof import("./games/jump/JumpGame.tsx").JumpGame;
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
}, {
    readonly id: "catch";
    readonly nameKey: "catch.name";
    readonly descriptionKey: "catch.desc";
    readonly Icon: ({ className }: import("./runtime/game-contract.ts").GameIconProps) => import("react").JSX.Element;
    readonly View: typeof import("./games/catch/CatchGame.tsx").CatchGame;
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
}, {
    readonly id: "runner";
    readonly nameKey: "runner.name";
    readonly descriptionKey: "runner.desc";
    readonly Icon: ({ className }: import("./runtime/game-contract.ts").GameIconProps) => import("react").JSX.Element;
    readonly View: typeof import("./games/runner/RunnerGame.tsx").RunnerGame;
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
}, {
    readonly id: "gomoku";
    readonly nameKey: "gomoku.name";
    readonly descriptionKey: "gomoku.desc";
    readonly Icon: ({ className }: import("./runtime/game-contract.ts").GameIconProps) => import("react").JSX.Element;
    readonly Setup: ({ variantId, selectVariant, translate }: import("./runtime/game-contract.ts").GameSetupProps) => import("react").JSX.Element;
    readonly View: typeof import("./games/gomoku/GomokuGame.tsx").GomokuGame;
    readonly defaultVariantId: "gomoku-normal";
    readonly initialHud: {
        readonly primary: {
            readonly id: "moves";
            readonly labelKey: "gomoku.stones";
            readonly value: 0;
        };
        readonly statusKey: "gomoku.turn.player";
    };
    readonly recordPolicy: {
        readonly kind: "none";
    };
}];
export type RegisteredGame = typeof GAMES[number];
export type GameId = RegisteredGame['id'];
export type RegisteredArcadeGameDefinition = ArcadeGameDefinition & {
    readonly id: GameId;
};
/** Resolve a compile-time registered game without duplicating switch branches. */
export declare function findGame(id: GameId): RegisteredArcadeGameDefinition;
