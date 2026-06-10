import { BodyparserConfig } from '@ioc:Adonis/Core/Bodyparser'

const bodyparserConfig: BodyparserConfig = {
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  json: {
    encoding: 'utf-8',
    limit: '1mb',
    strict: true,
    types: [
      'application/json',
      'application/x-www-form-urlencoded',
    ],
  },

  form: {
    encoding: 'utf-8',
    limit: '1mb',
    queryString: {},
    types: [
      'application/x-www-form-urlencoded',
    ],
  },

  raw: {
    encoding: 'utf-8',
    limit: '2mb',
    queryString: {},
    types: [
      'text/*',
    ],
  },

  multipart: {
    autoProcess: true,
    processManually: [],
    encoding: 'utf-8',
    maxFields: 100,
    limit: '20mb',
    types: [
      'multipart/form-data',
    ],
  },
}

export default bodyparserConfig
