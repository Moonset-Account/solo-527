import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { rules, schema } from '@adonisjs/validator'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(
      schema.create({
        username: schema.string({}, [rules.unique({ table: 'users', column: 'username' })]),
        email: schema.string({}, [rules.email(), rules.unique({ table: 'users', column: 'email' })]),
        password: schema.string({}, [rules.minLength(6)]),
        fullName: schema.string(),
        phone: schema.string.optional(),
        role: schema.enum.optional(['admin', 'store_manager', 'staff']),
        storeId: schema.number.optional(),
      })
    )

    const user = await User.create(data)
    const token = await User.accessTokens.create(user)

    return response.created({
      user: user.serialize(),
      token: token.value!.release(),
    })
  }

  async login({ request, response }: HttpContext) {
    const { uid, password } = request.only(['uid', 'password'])

    const user = await User.findBy('email', uid) || await User.findBy('username', uid)

    if (!user) {
      return response.unauthorized({ message: '账号或密码错误' })
    }

    if (!user.isActive) {
      return response.unauthorized({ message: '账号已被禁用' })
    }

    const isPasswordValid = await hash.verify(user.password, password)
    if (!isPasswordValid) {
      return response.unauthorized({ message: '账号或密码错误' })
    }

    await user.load('store')
    const token = await User.accessTokens.create(user)

    return {
      user: user.serialize(),
      token: token.value!.release(),
    }
  }

  async profile({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('store')
    return response.ok(user.serialize())
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.ok({ message: '退出成功' })
  }
}
