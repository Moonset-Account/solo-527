import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      username: schema.string({ trim: true }, [rules.maxLength(50)]),
      email: schema.string({ trim: true }, [rules.email(), rules.maxLength(255)]),
      password: schema.string({}, [rules.minLength(6), rules.maxLength(50)]),
      role: schema.enum.optional(['admin', 'operator', 'finance', 'video_team']),
    })

    const data = await request.validate({ schema: validationSchema })

    const existingUser = await User.query().where('email', data.email).first()
    if (existingUser) {
      return response.status(409).json({ message: '邮箱已被注册' })
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      role: data.role || 'operator',
    })

    return response.status(201).json({
      message: '注册成功',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    })
  }

  public async login({ request, auth, response }: HttpContextContract) {
    const email = request.input('email')
    const password = request.input('password')

    const user = await User.query().where('email', email).where('isActive', true).first()
    if (!user) {
      return response.status(401).json({ message: '用户名或密码错误' })
    }

    if (!(await Hash.verify(user.password, password))) {
      return response.status(401).json({ message: '用户名或密码错误' })
    }

    const token = await auth.use('api').generate(user, { expiresIn: '7 days' })

    return response.json({
      message: '登录成功',
      token: token.token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    })
  }

  public async logout({ auth, response }: HttpContextContract) {
    await auth.use('api').logout()
    return response.json({ message: '登出成功' })
  }

  public async me({ auth, response }: HttpContextContract) {
    const user = auth.user!
    return response.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })
  }
}
