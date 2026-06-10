import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class GuestMiddleware {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    if (auth.isAuthenticated) {
      return response.badRequest({ message: 'Already logged in' })
    }

    await next()
  }
}
