import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccessTokensController {
  async store({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    await user.load((loader) => loader.load('roles'))

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        department: user.department,
        status: user.status,
        roles: user.roles.map((role) => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName,
        })),
      },
      token: token.value!.release(),
    }
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}
