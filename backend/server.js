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

const { spawnSync } = require('node:child_process')
const path = require('node:path')

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
  const result = spawnSync(
    process.execPath,
    ['--loader', 'tsx', TSX_ENTRY, ...args],
    {
      cwd: APP_ROOT,
      env: { ...process.env, SWC_SKIP_NATIVE_BINDINGS: '1' },
      stdio: 'inherit'
    }
  )
  process.exit(result.status || 0)
}

try {
  require('@swc/wasm')
  process.env.SWC_SKIP_NATIVE_BINDINGS = '1'
} catch (e) {}

import('@poppinss/ts-exec')
  .then(() => import('./bin/server.js'))
  .catch((err) => {
    console.error('[server] Unable to bootstrap TypeScript runtime:')
    console.error(err && err.message ? err.message : err)
    console.error('\nPlease install tsx: npm install --save-dev tsx')
    process.exit(1)
  })
