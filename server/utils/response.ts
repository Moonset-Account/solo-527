import { randomUUID } from 'crypto'
import { prisma } from './prisma'

export function createTraceId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 24)
}

export async function logApiException(input: {
  method: string
  path: string
  status: number
  message: string
  stack?: string
  errorCode?: string
  issueCode?: string
  requestBody?: unknown
  traceId?: string
}) {
  try {
    await prisma.apiException.create({
      data: {
        traceId: input.traceId || createTraceId(),
        method: input.method,
        path: input.path,
        status: input.status,
        errorCode: input.errorCode,
        issueCode: input.issueCode,
        message: input.message,
        stack: input.stack,
        requestBody: input.requestBody ? JSON.stringify(input.requestBody) : null
      }
    })
  } catch (e) {
    console.error('[logApiException] failed', e)
  }
}

export function ok<T>(data: T, message = 'ok') {
  return { code: 0, message, data }
}

export function fail(message: string, code = 1, statusCode = 400) {
  const err = createError({ statusCode, statusMessage: message, data: { code, message } })
  return err
}

export function genIssueCode(): string {
  const d = new Date()
  const pad = (n: number, l = 2) => String(n).padStart(l, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `YT${stamp}${Math.floor(Math.random() * 900 + 100)}`
}
