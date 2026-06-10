import type { AppConfig } from '@ioc:Adonis/Core/Application'

const appConfig: AppConfig = {
  http: {
    allowMethodSpoofing: true,
    subdomainOffset: 2,
    generateRequestId: false,
    trustProxy: require('proxy-addr').compile('loopback'),
    etag: false,
    jsonpCallbackName: 'callback',
    cookie: {},
    forceContentNegotiationTo: 'application/json',
  },

  views: {
    cache: false,
  },

  static: {
    enabled: true,
    handle: true,
    dotFiles: 'ignore',
    etag: true,
    lastModified: true,
    maxAge: 0,
    immutable: false,
  },
}

export default appConfig
