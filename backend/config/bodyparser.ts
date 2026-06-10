const bodyparserConfig = {
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  json: {
    encoding: 'utf-8',
    limit: '1mb',
    strict: true,
    types: [
      'application/json',
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
    processManually: [] as string[],
    encoding: 'utf-8',
    maxFields: 100,
    limit: '20mb',
    types: [
      'multipart/form-data',
    ],
  },
}

export default bodyparserConfig
