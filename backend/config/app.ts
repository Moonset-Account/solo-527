// @ts-nocheck
import proxyAddr from 'proxy-addr'

const appConfig = {
  http: {
    allowMethodSpoofing: true,
    subdomainOffset: 2,
    generateRequestId: false,
    trustProxy: proxyAddr.compile('loopback'),
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
