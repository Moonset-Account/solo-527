import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  json: {
    encoding: 'utf-8',
    limit: '1mb',
    strict: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  form: {
    encoding: 'utf-8',
    limit: '1mb',
    queryString: {},
    convertEmptyStringsToNull: true,
    types: [
      'application/x-www-form-urlencoded',
    ],
  },

  multipart: {
    autoProcess: true,
    processManually: [],
    encoding: 'utf-8',
    maxFields: 1000,
    limit: '20mb',
    types: [
      'multipart/form-data',
    ],
  },
})

export default bodyParserConfig
