import type { GameIconProps, GameSetupProps } from '../../runtime/game-contract.ts';
import { GomokuGame } from './GomokuGame.tsx';
declare function GomokuIcon({ className }: GameIconProps): import("react").JSX.Element;
declare function GomokuSetup({ variantId, selectVariant, translate }: GameSetupProps): import("react").JSX.Element;
export declare const gomokuGame: {
    readonly id: "gomoku";
    readonly nameKey: "gomoku.name";
    readonly descriptionKey: "gomoku.desc";
    readonly Icon: typeof GomokuIcon;
    readonly Setup: typeof GomokuSetup;
    readonly View: typeof GomokuGame;
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
};
export {};
