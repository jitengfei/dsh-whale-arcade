import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import { type GameId } from '../game-registry.ts';
import { NS } from '../locales.ts';
type T = PropsLocale<typeof NS>['t'];
export interface GameRecordsProps {
    readonly game: GameId;
    readonly variantId?: string;
    readonly onGame: (game: GameId) => void;
    readonly t: T;
}
export declare function GameRecords({ game, variantId, onGame, t }: GameRecordsProps): import("react").JSX.Element;
export {};
