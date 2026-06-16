/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running HTTP server
|--------------------------------------------------------------------------
|
| This file detects whether @swc/core bindings are available. If not,
| it re-spawns itself using "tsx" (esbuild) which does not require
| native SWC bindings.
|
*/

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const APP_ROOT = path.resolve(__dirname)
const TSX_ENTRY = path.join(APP_ROOT, 'bin', 'server.ts')
const args = process.argv.slice(2)

let resolvedTsx = null
try {
  resolvedTsx = require.resolve('tsx/cli')
} catch (e) {}

if (!resolvedTsx) {
  try {
    resolvedTsx = require.resolve('tsx')
  } catch (e) {}
}

if (resolvedTsx) {
  const nodeMajor = Number(process.versions.node.split('.')[0])
  const loaderFlag = nodeMajor >= 22 ? '--import' : '--loader'
  const result = spawnSync(
    process.execPath,
    [loaderFlag, 'tsx', TSX_ENTRY, ...args],
    {
      cwd: APP_ROOT,
      env: { ...process.env, SWC_SKIP_NATIVE_BINDINGS: '1' },
      stdio: 'inherit'
    }
  )
  process.exit(result.status || 0)
}

try {
  await import('@swc/wasm')
  process.env.SWC_SKIP_NATIVE_BINDINGS = '1'
} catch (e) {}

try {
  await import('@poppinss/ts-exec')
  await import('./bin/server.js')
} catch (err) {
  console.error('[server] Unable to bootstrap TypeScript runtime:')
  console.error(err && err.message ? err.message : err)
  console.error('\nPlease install tsx: npm install --save-dev tsx')
  process.exit(1)
}
