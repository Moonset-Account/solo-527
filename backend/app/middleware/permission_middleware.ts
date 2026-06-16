import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, permissions: string | string[]) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.forbidden({ message: '未登录' })
    }

    await user.load((loader) => {
      loader.load('roles', (rolesLoader) => {
        rolesLoader.preload('permissions')
      })
    })

    const permissionNames = Array.isArray(permissions) ? permissions : [permissions]
    const userPermissions = new Set<string>()

    for (const role of user.roles) {
      for (const permission of role.permissions) {
        userPermissions.add(permission.name)
      }
    }

    const hasPermission = permissionNames.some((perm) => userPermissions.has(perm))

    if (!hasPermission) {
      return ctx.response.forbidden({ message: '权限不足' })
    }

    return next()
  }
}
