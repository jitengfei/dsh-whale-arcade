import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
type Props = PropsRuntime<'shell.overlay'> & PropsLocale<typeof NS>;
/** Floating catalog and neutral host for every registered local game. */
export declare function WhaleArcade({ t }: Props): import("react").JSX.Element;
export {};
