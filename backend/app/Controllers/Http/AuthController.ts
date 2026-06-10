import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class AuthController {
  public async login({ auth, request, response }: HttpContextContract) {
    const username = request.input('username', 'admin')
    const password = request.input('password', 'admin123')
    try {
      const token = await auth.use('api').attempt(username, password, {
        expiresIn: '7days',
      })
      const user = await User.query()
        .where('id', auth.user!.id)
        .select('id', 'username', 'real_name', 'role', 'is_active')
        .first()
      return response.ok({
        message: '登录成功',
        data: {
          token: token.token,
          user: user?.toJSON(),
        },
      })
    } catch (error) {
      return response.unauthorized({ message: '用户名或密码错误' })
    }
  }

  public async logout({ auth, response }: HttpContextContract) {
    await auth.use('api').revoke()
    return response.ok({ message: '退出成功' })
  }

  public async me({ auth, response }: HttpContextContract) {
    const user = await User.query()
      .where('id', auth.user!.id)
      .select('id', 'username', 'real_name', 'role', 'is_active', 'created_at', 'updated_at')
      .first()
    return response.ok({ data: user?.toJSON() })
  }
}
