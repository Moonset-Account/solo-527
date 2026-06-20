export default {
  appKey: process.env.APP_KEY,

  http: {
    allowMethodSpoofing: false,
    subdomainOffset: 2,
    generateRequestId: true,
    useAsyncLocalStorage: false,
    etag: false,
    cookie: {
      domain: '',
      path: '/',
      maxAge: 7200,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: false,
    },
    trustProxy: () => true,
  },

  logger: {
    name: 'tour-fulfillment-backend',
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      targets: [
        {
          target: 'pino/file',
          level: process.env.LOG_LEVEL || 'info',
          options: {
            destination: 1,
          },
        },
      ],
    },
  },

  profiler: {
    enabled: true,
    blacklist: [],
  },
}
