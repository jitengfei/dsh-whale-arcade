/** Package-owned invariant companion for the browser-only whale arcade. */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = 'dsh-whale-arcade'

/** Cordis companion plugin name. */
export const name = 'client-ui-whale-arcade-invariant'
/** Service required to reserve package ownership. */
export const inject = ['invariants']

/** No runtime invariant: game state is browser-local and never crosses a product boundary. */
const install: InvariantInstaller = () => {}

/** Register the package invariant companion. */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
