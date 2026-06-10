require('reflect-metadata')
require('source-map-support').install()
require('ts-node').register({
  project: `${__dirname}/tsconfig.json`,
  transpileOnly: true,
})

module.exports = require('./server.ts')
