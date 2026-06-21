import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { PermissionDeniedException } from '#exceptions/handler'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await ctx.auth.check()
    } catch {
      throw new PermissionDeniedException('未登录或登录已过期，请先登录')
    }

    const user = ctx.auth.user
    if (!user || !user.isActive) {
      try {
        await ctx.auth.logout()
      } catch {
        // ignore
      }
      throw new PermissionDeniedException('账号已被禁用，请联系管理员')
    }

    await next()
  }
}
