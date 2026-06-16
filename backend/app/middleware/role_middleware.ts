import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, roles: string | string[]) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.forbidden({ message: '未登录' })
    }

    await user.load((loader) => loader.load('roles'))

    const roleNames = Array.isArray(roles) ? roles : [roles]
    const hasRole = user.roles.some((role) => roleNames.includes(role.name))

    if (!hasRole) {
      return ctx.response.forbidden({ message: '权限不足' })
    }

    return next()
  }
}
