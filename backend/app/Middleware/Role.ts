import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Role from 'App/Models/Role'

export default class RoleMiddleware {
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    roles: string[]
  ) {
    if (!auth.user) {
      return response.unauthorized({ message: '请先登录' })
    }

    const userRoles = await auth.user.related('roles').query()
    const hasRole = userRoles.some((role) => roles.includes(role.slug))

    if (!hasRole) {
      return response.forbidden({ message: '权限不足，无法执行此操作' })
    }

    await next()
  }
}
