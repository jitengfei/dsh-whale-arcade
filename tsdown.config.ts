import { readFile } from 'node:fs/promises'
import { dirname, relative, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const ID = 'dsh-whale-arcade'
const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url))

// These modules are supplied by the Harness web module table and must keep
// their application-wide identity instead of being copied into the plugin.
const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-runtime/client',
] as const

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

function cssModulesPlugin(): NonNullable<UserConfig['plugins']>[number] {
  return {
    name: 'dsh-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const absolutePath = importer === undefined ? source : resolvePath(dirname(importer), source)
      const stablePath = relative(PROJECT_ROOT, absolutePath).replaceAll('\\', '/')
      return CSS_VIRTUAL_PREFIX + stablePath + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const stablePath = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      const filePath = resolvePath(PROJECT_ROOT, stablePath)
      this.addWatchFile(filePath)
      const source = await readFile(filePath)
      const { code, exports: cssExports } = transform({
        filename: stablePath,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap = Object.fromEntries(
        Object.entries(cssExports ?? {})
          .map(([local, value]) => [local, value.name] as const)
          .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
      )
      const tagId = `${ID}/${stablePath}`
      return [
        `const css = ${JSON.stringify(code.toString())};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
        "  const tag = document.createElement('style');",
        `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
    },
  }
}

function purityGate(): NonNullable<UserConfig['plugins']>[number] {
  return {
    name: 'dsh-client-bundle-purity',
    resolveId(source: string) {
      if (!source.startsWith('@deepseek-ai/') || EXTERNALS.includes(source as typeof EXTERNALS[number])) return null
      throw new Error(
        `client bundle purity: "${source}" is not available in the Harness module table; use an injected Cordis service instead`,
      )
    },
  }
}

const library: UserConfig = {
  name: ID,
  entry: ['src/index.ts', 'src/invariant.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  sourcemap: false,
  clean: false,
}

const client: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  sourcemap: false,
  clean: false,
  deps: {
    neverBundle: [...EXTERNALS],
    alwaysBundle: (moduleId: string) => !EXTERNALS.includes(moduleId as typeof EXTERNALS[number]),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [purityGate(), cssModulesPlugin()],
  outputOptions: {
    entryFileNames: 'client.js',
    codeSplitting: false,
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [library, client]
