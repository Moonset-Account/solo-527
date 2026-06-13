#!/usr/bin/env node
/*
|--------------------------------------------------------------------------
| Ace entry point
|--------------------------------------------------------------------------
|
| The "ace.ts" file is the entrypoint for Ace commands.
|
*/

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)
const PROVIDERS_FILE = new URL('./providers.ts', APP_ROOT).href

new Ignitor(APP_ROOT, { providersFile: PROVIDERS_FILE })
  .ace()
  .handle(process.argv.splice(2))
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
