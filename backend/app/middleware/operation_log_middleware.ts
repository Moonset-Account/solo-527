import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import OperationLogService from '#services/operation_log_service'

export default class OperationLogMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const result = await next()

    if (ctx.auth.user) {
      const method = ctx.request.method()
      const path = ctx.request.url()
      const status = ctx.response.response.statusCode

      await OperationLogService.log(ctx, `${method} ${path}`, 'request', undefined, {
        status,
        method,
        path,
      })
    }

    return result
  }
}
