import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { WhaleArcade } from './WhaleArcade.tsx'
import { en, NS, zh, type WhaleArcadeKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { /** Whale arcade copy. */ 'whaleArcade': WhaleArcadeKey }
}

/** Required services for locale and shell-overlay registration. */
export const inject = ['slots', 'locale']

/** Register the floating arcade in the frame-wide overlay. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-whale-arcade: dictionaries')
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'whale-arcade', order: 100, locale: NS,
  }, WhaleArcade))
}
