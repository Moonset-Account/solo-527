import { ShieldConfig } from '@ioc:Adonis/Addons/Shield'

const shieldConfig: ShieldConfig = {
  csrf: {
    enabled: false,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    enableXsrfCookie: false,
  },
  csp: {
    enabled: false,
  },
  xFrame: {
    enabled: true,
    action: 'SAMEORIGIN',
  },
  contentTypeSniffing: {
    enabled: true,
  },
  hsts: {
    enabled: false,
  },
  xss: {
    enabled: true,
  },
  noOpen: {
    enabled: true,
  },
  dnsPrefetch: {
    enabled: false,
  },
}

export default shieldConfig
