import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core/core'
import sourceMapSupport from 'source-map-support'

const appRoot = new URL('../', import.meta.url)

sourceMapSupport.install({ handleUncaughtExceptions: false, environment: 'node' })

new Ignitor(appRoot).handleAce(process.argv.slice(2)).catch(console.error)
