/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running HTTP server
|--------------------------------------------------------------------------
|
| DO NOT MODIFY THIS FILE AS IT WILL BE OVERRIDDEN DURING THE BUILD
| PROCESS.
|
| See docs.adonisjs.com/guides/typescript-build-process#creating-production-build
|
| Since, we cannot run TypeScript source code using "node" binary, we need
| a JavaScript entrypoint to run the HTTP server.
|
| This file registers the "ts-exec" hook with the Node.js module system
| and then imports the "bin/server.ts" file.
|
*/

process.env.SWC_SKIP_NATIVE_BINDINGS = '1'
try {
  const binding = require.resolve('@swc/wasm')
  if (binding) process.env.__SWC_WASM_BINDING__ = binding
} catch (e) {}

/**
 * Register hook to process TypeScript files using @poppinss/ts-exec
 */
import '@poppinss/ts-exec'

/**
 * Import HTTP server entrypoint
 */
await import('./bin/server.js')
