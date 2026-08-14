import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const requiredFiles = [
  'lib/index.js',
  'lib/invariant.js',
  'lib/client.js',
  'lib/types/index.d.ts',
  'lib/types/invariant.d.ts',
  'lib/types/client/index.d.ts',
]

await Promise.all(requiredFiles.map(file => readFile(resolve(projectRoot, file))))

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  }))
  return nested.flat()
}

const manifest = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'))
const serializedManifest = JSON.stringify(manifest)
if (serializedManifest.includes('workspace:')) throw new Error('package.json must not contain workspace: dependency ranges')
if (Object.hasOwn(manifest.exports, './src/*')) throw new Error('package.json must not export source files excluded from the package')

const client = await readFile(resolve(projectRoot, 'lib/client.js'), 'utf8')
if (!client.includes('window.__ModuleLoader__.load({') || !client.includes('id: "dsh-whale-arcade"')) {
  throw new Error('lib/client.js does not register the expected Harness client module')
}
if (/\\0dsh-css:(?:\/|[A-Za-z]:)/.test(client)) {
  throw new Error('lib/client.js contains an absolute CSS module path')
}

const artifactFiles = await listFiles(resolve(projectRoot, 'lib'))
for (const file of artifactFiles) {
  if (file.endsWith('.map')) throw new Error(`release artifact includes a source map: ${file}`)
  if (!file.endsWith('.js') && !file.endsWith('.d.ts')) continue
  const source = await readFile(file, 'utf8')
  if (source.includes('sourceMappingURL=')) throw new Error(`release artifact refers to a missing source map: ${file}`)
  if (/(?:file:\/{2,3}|\/home\/|\/Users\/|[A-Z]:[\\/])/.test(source)) {
    throw new Error(`release artifact contains an absolute local path: ${file}`)
  }
}
