#!/usr/bin/env node
import { Ignitor from '@adonisjs/core/core'
import sourceMapSupport from 'source-map-support'

sourceMapSupport.install({ handleUncaughtExceptions: false, environment: 'node' })

const appRoot = new URL('./', import.meta.url)
new Ignitor(appRoot).handleAce(process.argv.slice(2)).catch(console.error)
