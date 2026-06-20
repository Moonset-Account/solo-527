import { logApiException } from '../utils/response'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, { event }) => {
    if (!event) return
    try {
      const traceId = (event.context as any).traceId
      const url = getRequestURL(event)
      const status = (error as any).statusCode || (error as any).status || 500
      await logApiException({
        traceId,
        method: event.node.req.method || 'GET',
        path: url.pathname,
        status,
        message: (error as any).message || String(error),
        stack: (error as any).stack,
        errorCode: (error as any).data?.code ? String((error as any).data.code) : undefined,
        issueCode: (event.context as any).issueCode
      })
    } catch (e) {
      console.error('[nitro:error] hook failed', e)
    }
  })

  nitroApp.hooks.hook('afterResponse', async (event) => {
    if (!event) return
    try {
      const statusCode = event.node.res.statusCode
      if (statusCode >= 400 && statusCode !== 404) {
        const traceId = (event.context as any).traceId
        const url = getRequestURL(event)
        const errorMessage = (event as any)._errorMessage || `HTTP ${statusCode}`
        await logApiException({
          traceId,
          method: event.node.req.method || 'GET',
          path: url.pathname,
          status: statusCode,
          message: errorMessage,
          issueCode: (event.context as any).issueCode
        })
      }
    } catch (e) {
      // ignore
    }
  })
})
