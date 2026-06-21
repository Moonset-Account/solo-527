import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as vineErrors } from '@vinejs/vine'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errorResponse } from '../app/utils/helpers.js'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages: boolean = false
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {}

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      const errors = error.messages.map((m) => ({
        field: m.field,
        message: m.message,
      }))
      return ctx.response.status(422).json(errorResponse(422, '请求参数校验失败', errors))
    }

    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      return ctx.response.status(401).json(errorResponse(401, '用户名或密码错误'))
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return ctx.response.status(401).json(errorResponse(401, '未登录或登录已过期'))
    }

    if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
      return ctx.response.status(404).json(errorResponse(404, '资源不存在'))
    }

    if (error instanceof BusinessException) {
      return ctx.response.status(error.statusCode).json(errorResponse(error.code, error.message, error.errors))
    }

    if (error instanceof PermissionDeniedException) {
      return ctx.response.status(403).json(errorResponse(403, error.message || '权限不足'))
    }

    if (this.debug) {
      return super.handle(error, ctx)
    }

    ctx.logger.error({ err: error }, 'Unhandled exception')
    return ctx.response.status(500).json(errorResponse(500, '服务器内部错误'))
  }

  async report(error: unknown, ctx: HttpContext) {
    if (
      error instanceof vineErrors.E_VALIDATION_ERROR ||
      error instanceof authErrors.E_INVALID_CREDENTIALS ||
      error instanceof authErrors.E_UNAUTHORIZED_ACCESS ||
      error instanceof lucidErrors.E_ROW_NOT_FOUND ||
      error instanceof BusinessException ||
      error instanceof PermissionDeniedException
    ) {
      return
    }
    return super.report(error, ctx)
  }
}

export class BusinessException extends Error {
  statusCode: number
  code: number
  errors?: any[]

  constructor(message: string, code = 4000, statusCode = 400, errors?: any[]) {
    super(message)
    this.name = 'BusinessException'
    this.code = code
    this.statusCode = statusCode
    this.errors = errors
  }
}

export class PermissionDeniedException extends Error {
  constructor(message?: string) {
    super(message || '权限不足')
    this.name = 'PermissionDeniedException'
  }
}

export class ResourceNotFoundException extends Error {
  constructor(message = '资源不存在') {
    super(message)
    this.name = 'ResourceNotFoundException'
  }
}
