import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type WhaleArcadeKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'whaleArcade': WhaleArcadeKey;
    }
}
/** Required services for locale and shell-overlay registration. */
export declare const inject: string[];
/** Register the floating arcade in the frame-wide overlay. */
export declare function apply(ctx: ClientContext): void;
