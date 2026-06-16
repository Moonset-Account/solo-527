import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthMiddleware {
  public async handle({ auth, response }: HttpContext, next: () => Promise<void>) {
    await auth.authenticate()

    const user = auth.user as User
    if (!user.isActive) {
      return response.forbidden({ message: '账号已被禁用' })
    }

    await next()
  }
}
