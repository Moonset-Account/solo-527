import BaseExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import Logger from '@ioc:Adonis/Core/Logger'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ExceptionHandler extends BaseExceptionHandler {
  protected logger = Logger

  public async handle(error: any, ctx: HttpContextContract) {
    if (error.code === 'E_VALIDATION_FAILURE') {
      return ctx.response.status(422).json({
        message: '数据验证失败',
        errors: error.messages?.errors || error.messages,
        code: 'VALIDATION_ERROR',
      })
    }

    if (error.code === 'E_UNAUTHORIZED_ACCESS') {
      return ctx.response.status(401).json({
        message: '未授权访问，请先登录',
        code: 'UNAUTHORIZED',
      })
    }

    if (error.code === 'E_ROW_NOT_FOUND') {
      return ctx.response.status(404).json({
        message: '资源不存在',
        code: 'NOT_FOUND',
      })
    }

    if (error.code === 'E_FORBIDDEN') {
      return ctx.response.status(403).json({
        message: '权限不足',
        code: 'FORBIDDEN',
      })
    }

    if (ctx.request.url().startsWith('/api/')) {
      return ctx.response.status(error.status || 500).json({
        message: error.message || '服务器内部错误',
        code: error.code || 'INTERNAL_ERROR',
      })
    }

    return super.handle(error, ctx)
  }

  public async report(error: any, ctx: HttpContextContract) {
    if (!this.shouldReport(error)) {
      return
    }

    if (typeof error.report === 'function') {
      error.report(error, ctx)
      return
    }

    this.logger.error({ err: error }, error.message)
  }
}
