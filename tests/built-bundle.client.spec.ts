// @vitest-environment jsdom
import * as React from 'react'
import * as ReactJsxRuntime from 'react/jsx-runtime'
import { afterEach, describe, expect, it } from 'vitest'

type BundleExports = { readonly apply: unknown; readonly inject: readonly string[] }
type ClientBundle = {
  readonly id: string
  readonly factory: (requireModule: (moduleId: string) => unknown) => BundleExports
}

const browserWindow = window as typeof window & { __ModuleLoader__?: { load(bundle: ClientBundle): void } }
const previousLoader = browserWindow.__ModuleLoader__

afterEach(() => {
  if (previousLoader === undefined) delete browserWindow.__ModuleLoader__
  else browserWindow.__ModuleLoader__ = previousLoader
})

describe('committed Harness client bundle', () => {
  it('registers and evaluates as a prebuilt loader module', async () => {
    let bundle: ClientBundle | undefined
    browserWindow.__ModuleLoader__ = { load(value) { bundle = value } }
    // @ts-expect-error The Harness loader script intentionally has no direct-import declaration.
    await import('../lib/client.js')
    expect(bundle?.id).toBe('dsh-whale-arcade')
    expect(String(bundle?.factory)).toContain('createActiveTimer')

    const exports = bundle?.factory((moduleId) => {
      if (moduleId === 'react') return React
      if (moduleId === 'react/jsx-runtime') return ReactJsxRuntime
      throw new Error(`Unexpected built client dependency: ${moduleId}`)
    })
    expect(exports?.inject).toEqual(['slots', 'locale'])
    expect(exports?.apply).toBeTypeOf('function')
  })
})
