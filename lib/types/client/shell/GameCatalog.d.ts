import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import { type GameId } from '../game-registry.ts';
import { NS } from '../locales.ts';
type T = PropsLocale<typeof NS>['t'];
export interface GameCatalogProps {
    readonly onSelect: (game: GameId) => void;
    readonly t: T;
}
export declare function GameCatalog({ onSelect, t }: GameCatalogProps): import("react").JSX.Element;
export {};
