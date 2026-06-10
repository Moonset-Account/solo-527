import { verifyToken, getTokenFromEvent } from './jwt'
import type { H3Event } from 'h3'

export async function requireAuth(event: H3Event) {
  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登录',
    })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: '登录已过期，请重新登录',
    })
  }

  event.context.auth = payload
  return payload
}

export async function requireRole(event: H3Event, roles: string[]) {
  const auth = await requireAuth(event)
  if (!roles.includes(auth.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: '无权限访问',
    })
  }
  return auth
}

export function successResponse(data: any = null, message: string = 'success') {
  return {
    code: 0,
    data,
    message,
  }
}

export function errorResponse(message: string, code: number = -1, data: any = null) {
  return {
    code,
    data,
    message,
  }
}

export function paginate(total: number, list: any[], page: number, pageSize: number) {
  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
