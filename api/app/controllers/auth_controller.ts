import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  public async register({ request, response }: HttpContext) {
    const { email, password, fullName, role, phone } = request.only([
      'email',
      'password',
      'fullName',
      'role',
      'phone',
    ])

    if (!email || !password || !fullName) {
      return response.badRequest({ message: '邮箱、密码和姓名为必填项' })
    }

    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      return response.badRequest({ message: '该邮箱已注册' })
    }

    const user = await User.create({
      email,
      password,
      fullName,
      role: role || 'staff',
      phone: phone || null,
    })

    return response.created({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    })
  }

  public async login({ request, response, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    if (!email || !password) {
      return response.badRequest({ message: '邮箱和密码为必填项' })
    }

    const user = await User.findBy('email', email)
    if (!user) {
      return response.unauthorized({ message: '邮箱或密码错误' })
    }

    const passwordValid = await hash.verify(user.password, password)
    if (!passwordValid) {
      return response.unauthorized({ message: '邮箱或密码错误' })
    }

    if (!user.isActive) {
      return response.forbidden({ message: '账号已被禁用' })
    }

    const token = await auth.use('api').generate(user)

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token: token,
    })
  }

  public async me({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.ok({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    })
  }

  public async logout({ auth, response }: HttpContext) {
    await auth.use('api').revoke()
    return response.ok({ message: '已退出登录' })
  }
}
