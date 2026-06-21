import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { PermissionDeniedException } from '#exceptions/handler'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      throw new PermissionDeniedException('未登录或登录已过期')
    }

    if (user.role !== 'admin') {
      throw new PermissionDeniedException('权限不足，需要管理员权限')
    }

    await next()
  }
}
