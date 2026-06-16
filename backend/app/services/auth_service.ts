import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class AuthService {
  static async login(ctx: HttpContext, email: string, password: string) {
    const user = await User.verifyCredentials(email, password)

    user.lastLoginAt = DateTime.now()
    user.lastLoginIp = ctx.request.ip()
    await user.save()

    const token = await User.accessTokens.create(user)

    return { user, token: token.value!.release() }
  }

  static async logout(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return
    }

    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }
  }

  static async getUserPermissions(userId: number) {
    const user = await User.findOrFail(userId)
    await user.load('roles', (query) => {
      query.preload('permissions')
    })

    const permissions = new Set<string>()
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        permissions.add(permission.name)
      }
    }

    return Array.from(permissions)
  }
}
