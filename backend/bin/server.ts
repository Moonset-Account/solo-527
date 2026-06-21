import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core/core'
import sourceMapSupport from 'source-map-support'
import { ace } from '@adonisjs/core/services/ace'

const appRoot = new URL('../', import.meta.url)

sourceMapSupport.install({ handleUncaughtExceptions: false, environment: 'node' })

new Ignitor(appRoot).listenHttp().catch(console.error)

void ace.handleGlobalError
