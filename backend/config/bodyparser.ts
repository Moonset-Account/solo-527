import { BodyParserConfig } from '@ioc:Adonis/Core/BodyParser'

const bodyParserConfig: BodyParserConfig = {
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  json: {
    encoding: 'utf-8',
    limit: '10mb',
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
    limit: '20mb',
    queryString: {},
    convertEmptyStringsToNull: true,
    types: [
      'application/x-www-form-urlencoded',
    ],
  },
  raw: {
    encoding: 'utf-8',
    limit: '50mb',
    queryString: {},
    types: [
      'text/*',
    ],
  },
  multipart: {
    autoProcess: true,
    processManually: [],
    encoding: 'utf-8',
    limit: '200mb',
    convertEmptyStringsToNull: true,
    types: [
      'multipart/form-data',
    ],
  },
}

export default bodyParserConfig
