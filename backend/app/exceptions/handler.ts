import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (ctx.request.url().startsWith('/api')) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return ctx.response.status(422).json({
          message: '请求参数验证失败',
          errors: error.messages?.errors || error.messages,
        })
      }

      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return ctx.response.status(401).json({
          message: '请先登录',
        })
      }

      if (error.code === 'E_INVALID_AUTH_UID' || error.code === 'E_INVALID_AUTH_PASSWORD') {
        return ctx.response.status(401).json({
          message: '账号或密码错误',
        })
      }

      return ctx.response.status(error.status || 500).json({
        message: this.debug ? error.message : '服务器内部错误',
        ...(this.debug && error.stack ? { stack: error.stack } : {}),
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    if (this.shouldReport(error as any)) {
      ctx.logger.error({ err: error, request_id: ctx.request.id() })
    }
  }
}
