import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, loginValidator } from '#validators/auth'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  async register({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const existingUser = await User.query()
      .where('phone', data.phone)
      .first()

    if (existingUser) {
      return response
        .status(400)
        .json({ message: '该手机号已注册' })
    }

    if (data.email) {
      const existingEmail = await User.query()
        .where('email', data.email)
        .first()
      if (existingEmail) {
        return response
          .status(400)
          .json({ message: '该邮箱已注册' })
      }
    }

    const user = await User.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      password: data.password,
      role: data.role || 'user',
    })

    await auth.use('web').login(user)

    return response.json({
      message: '注册成功',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    })
  }

  async login({ request, response, auth }: HttpContext) {
    const { account, password } = await request.validateUsing(loginValidator)

    const user = await User.query()
      .where('phone', account)
      .orWhere('email', account)
      .first()

    if (!user) {
      return response
        .status(401)
        .json({ message: '账号或密码错误' })
    }

    const passwordValid = await hash.verify(user.password, password)
    if (!passwordValid) {
      return response
        .status(401)
        .json({ message: '账号或密码错误' })
    }

    await auth.use('web').login(user)

    return response.json({
      message: '登录成功',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    })
  }

  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.json({ message: '登出成功' })
  }

  async me({ response, auth }: HttpContext) {
    const user = auth.user!

    return response.json({
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    })
  }
}
