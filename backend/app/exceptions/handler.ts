import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  protected renderStatusPages = false

  protected context(ctx: HttpContext) {
    return {
      requestId: ctx.request.id,
      url: ctx.request.url(),
      method: ctx.request.method(),
      userId: ctx.auth?.user?.id,
    }
  }

  async handle(error: unknown, ctx: HttpContext) {
    ctx.response.tryHeader('X-Content-Type-Options', 'nosniff')

    const code = (error as any)?.code || (error as any)?.status || 500
    const status = (error as any)?.status || 500
    const message = (error as any)?.message || '服务器内部错误'

    if (ctx.request.url().startsWith('/api/')) {
      if (code === 'E_ROW_NOT_FOUND') {
        return ctx.response.notFound({
          code: 404,
          message: '请求的资源不存在',
          errors: [{ message: '请求的资源不存在' }],
        })
      }

      if (code === 'E_UNAUTHORIZED_ACCESS') {
        return ctx.response.unauthorized({
          code: 401,
          message: '未登录或登录已过期',
          errors: [{ message: '请重新登录' }],
        })
      }

      if (code === 'E_INVALID_AUTH_UID' || code === 'E_INVALID_AUTH_PASSWORD') {
        return ctx.response.unauthorized({
          code: 401,
          message: '用户名或密码错误',
          errors: [{ message: '用户名或密码错误' }],
        })
      }

      if (code === 'E_VALIDATION_ERROR') {
        const errors = (error as any)?.messages?.errors || (error as any)?.errors || []
        const msgs = errors.map((e: any) => ({
          message: e.message || '数据验证失败',
          field: e.field || e.rule,
        }))
        return ctx.response.status(422).json({
          code: 422,
          message: msgs[0]?.message || '数据验证失败',
          errors: msgs,
        })
      }

      if (status === 403) {
        return ctx.response.forbidden({
          code: 403,
          message: '没有权限执行此操作',
          errors: [{ message: '没有权限执行此操作' }],
        })
      }

      if (status >= 400 && status < 500) {
        return ctx.response.status(status).json({
          code: status,
          message,
          errors: [{ message }],
        })
      }

      if (this.debug) {
        return ctx.response.status(status).json({
          code: status,
          message,
          error: {
            name: (error as any)?.name,
            stack: (error as any)?.stack,
          },
          errors: [{ message }],
        })
      }

      return ctx.response.internalServerError({
        code: 500,
        message: '服务器内部错误',
        errors: [{ message: '请稍后重试或联系管理员' }],
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    if ((error as any)?.status && (error as any).status < 500) {
      return
    }
    return super.report(error, ctx)
  }
}
