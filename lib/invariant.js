//#region src/invariant.ts
const PACKAGE_NAME = "dsh-whale-arcade";
/** Cordis companion plugin name. */
const name = "client-ui-whale-arcade-invariant";
/** Service required to reserve package ownership. */
const inject = ["invariants"];
/** No runtime invariant: game state is browser-local and never crosses a product boundary. */
const install = () => {};
/** Register the package invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
