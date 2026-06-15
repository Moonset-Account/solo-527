require('reflect-metadata')
const sourceMapSupport = require('source-map-support')
const { Ignitor } = require('@adonisjs/core/build/standalone')

sourceMapSupport.install({ handleUncaughtExceptions: false })

new Ignitor(__dirname).httpServer().start()
