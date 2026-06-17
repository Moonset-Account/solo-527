import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@adonisjs/core/ace'

processCLIArgs(process.argv.splice(2))
configure({
  commands: [],
  rcFile: () => import('./adonisrc.js'),
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
  ],
}).catch((error) => {
  process.exitCode = 1
  prettyPrintError(error)
})
