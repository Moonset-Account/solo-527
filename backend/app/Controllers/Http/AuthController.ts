import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import LoginValidator from 'App/Validators/Auth/LoginValidator'

export default class AuthController {
  public async login({ auth, request, response }: HttpContextContract) {
    const { email, password } = await request.validate(LoginValidator)

    try {
      const token = await auth.use('api').attempt(email, password, {
        expiresIn: '7days',
      })

      const user = auth.user!
      await user.load('roles')

      return response.ok({
        message: '登录成功',
        token: token.token,
        type: 'bearer',
        expiresIn: '7days',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          realName: user.realName,
          phone: user.phone,
          department: user.department,
          roles: user.roles.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
          })),
        },
      })
    } catch (error) {
      return response.badRequest({
        message: '邮箱或密码错误',
        code: 'INVALID_CREDENTIALS',
      })
    }
  }

  public async logout({ auth, response }: HttpContextContract) {
    await auth.use('api').revoke()

    return response.ok({
      message: '已退出登录',
    })
  }

  public async me({ auth, response }: HttpContextContract) {
    if (!auth.user) {
      return response.unauthorized({ message: '请先登录' })
    }

    const user = auth.user
    await user.load('roles')

    return response.ok({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        phone: user.phone,
        department: user.department,
        isActive: user.isActive,
        roles: user.roles.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
        })),
      },
    })
  }
}
