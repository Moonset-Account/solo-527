import { logApiException, createTraceId } from '../utils/response'

export default defineEventHandler(async (event) => {
  const traceId = getHeader(event, 'x-trace-id') || createTraceId()
  event.context.traceId = traceId
  setHeader(event, 'x-trace-id', traceId)

  try {
    await next()
  } catch (err: any) {
    const status = err.statusCode || 500
    const url = getRequestURL(event)
    await logApiException({
      traceId,
      method: event.node.req.method || 'GET',
      path: url.pathname,
      status,
      message: err.message || 'Unknown error',
      stack: err.stack,
      errorCode: err.data?.code ? String(err.data.code) : undefined,
      issueCode: event.context.issueCode
    })
    if (!event.node.res.headersSent) {
      return send(event, JSON.stringify({
        code: err.data?.code || status,
        message: err.statusMessage || err.message || '服务器异常',
        traceId,
        data: null
      }), 'application/json')
    }
  }
})
