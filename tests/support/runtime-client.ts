import * as Cordis from '@deepseek-ai/cordis'
import * as UiSlots from '@deepseek-ai/dsh-client-ui-slots'

type RuntimeClient = typeof import('@deepseek-ai/dsh-client-runtime/client')
type ClientBundle = {
  readonly factory: (requireModule: (moduleId: string) => unknown) => RuntimeClient
}

let runtimeClient: RuntimeClient | undefined
const browserWindow = window as typeof window & {
  __ModuleLoader__?: { load(bundle: ClientBundle): void }
}
const previousLoader = browserWindow.__ModuleLoader__
browserWindow.__ModuleLoader__ = {
  load(bundle) {
    runtimeClient = bundle.factory((moduleId) => {
      if (moduleId === '@deepseek-ai/cordis') return Cordis
      if (moduleId === '@deepseek-ai/dsh-client-ui-slots') return UiSlots
      throw new Error(`Unexpected runtime client dependency: ${moduleId}`)
    })
  },
}

// The published client entry is a Harness loader script rather than an ESM module.
// @ts-expect-error Its browser bundle intentionally has no direct-import declaration.
await import('../../node_modules/@deepseek-ai/dsh-client-runtime/lib/client.js')
if (previousLoader === undefined) delete browserWindow.__ModuleLoader__
else browserWindow.__ModuleLoader__ = previousLoader

if (runtimeClient === undefined) throw new Error('Harness runtime client bundle did not register')
export const SlotRegistry = runtimeClient.SlotRegistry
