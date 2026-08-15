import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { ArcadeGameDefinition } from '../game-registry.ts';
import { NS } from '../locales.ts';
import type { GameSessionBinding } from '../runtime/use-game-session.ts';
type T = PropsLocale<typeof NS>['t'];
export interface GameFrameProps {
    readonly definition: ArcadeGameDefinition;
    readonly session: GameSessionBinding;
    readonly onBack: () => void;
    readonly onClose: () => void;
    readonly t: T;
}
export declare function GameFrame({ definition, session, onBack, onClose, t }: GameFrameProps): import("react").JSX.Element;
export {};
