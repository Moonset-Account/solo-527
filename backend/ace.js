/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running ace commands
|--------------------------------------------------------------------------
*/

import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@adonisjs/core/ace'

processCLIArgs(process.argv.splice(2))

configure({
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/redis/commands'),
  ],
  rcFile: () => import('../adonisrc.js'),
}).catch((error) => {
  process.exitCode = 1
  prettyPrintError(error)
})
