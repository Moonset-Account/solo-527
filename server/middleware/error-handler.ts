import { createTraceId } from '../utils/response'

export default defineEventHandler((event) => {
  const traceId = getHeader(event, 'x-trace-id') || createTraceId()
  event.context.traceId = traceId
  setHeader(event, 'x-trace-id', traceId)
})
