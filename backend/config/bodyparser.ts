import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    types: ['application/x-www-form-urlencoded'],
    limit: '1mb',
    convertEmptyStringsToNull: true
  },

  json: {
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report'
    ],
    limit: '5mb',
    strict: true,
    convertEmptyStringsToNull: true
  },

  multipart: {
    types: ['multipart/form-data'],
    limit: '20mb',
    autoProcess: true,
    processManually: [],
    convertEmptyStringsToNull: true,
    maxFields: 1000
  }
})

export default bodyParserConfig
