import prisma from './prisma'

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  endpoint?: string
  method?: string
  requestBody?: any
  interviewId?: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<{ data: T | null; retryLog: any }> {
  const { maxRetries = 3, initialDelay = 1000, endpoint = '', method = 'POST', requestBody, interviewId } = options
  let lastError: Error | null = null
  let retryCount = 0
  const startTime = new Date()

  const baseLog = {
    endpoint,
    method,
    maxRetries,
    lastAttemptAt: startTime,
    requestBody: requestBody ? JSON.stringify(requestBody) as any : null,
    interviewId
  }

  while (retryCount <= maxRetries) {
    try {
      const data = await fn()
      const retryLog = await prisma.apiRetryLog.create({
        data: {
          ...baseLog,
          retryCount,
          lastAttemptAt: new Date(),
          isSuccess: true,
          successAt: new Date(),
          errorMessage: '',
          responseBody: data ? JSON.stringify(data) as any : null
        }
      })
      return { data, retryLog }
    } catch (error: any) {
      lastError = error
      retryCount++

      if (retryCount <= maxRetries) {
        const delay = initialDelay * Math.pow(2, retryCount - 1)
        const nextRetryAt = new Date(Date.now() + delay)
        await prisma.apiRetryLog.create({
          data: {
            ...baseLog,
            retryCount,
            lastAttemptAt: new Date(),
            nextRetryAt,
            isSuccess: false,
            errorMessage: error?.message || 'Unknown error',
            errorCode: error?.code || null,
            responseBody: error?.response ? JSON.stringify(error.response) as any : null
          }
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        const retryLog = await prisma.apiRetryLog.create({
          data: {
            ...baseLog,
            retryCount,
            lastAttemptAt: new Date(),
            isSuccess: false,
            errorMessage: error?.message || 'Unknown error',
            errorCode: error?.code || null,
            responseBody: error?.response ? JSON.stringify(error.response) as any : null
          }
        })
        return { data: null, retryLog }
      }
    }
  }

  throw lastError
}
