import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginSchema } from '#validators/index'
import { successResponse, errorResponse } from '../utils/helpers.js'

export default class AuthController {
  async login({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(loginSchema)

    try {
      const { username, password } = payload

      const user = await User.verifyCredentials(username, password)

      if (!user.isActive) {
        return response.status(403).json(errorResponse(403, '账号已被禁用，请联系管理员'))
      }

      await auth.use('web').login(user)

      const token = await User.accessTokens.create(user, ['*'], {
        name: `login-${Date.now()}`,
      })

      return response.json(
        successResponse(
          {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
              isActive: user.isActive,
              createdAt: user.createdAt,
            },
            token: token.value!.release(),
          },
          '登录成功',
        ),
      )
    } catch (error) {
      if ((error as any)?.code === 'E_INVALID_CREDENTIALS') {
        return response.status(401).json(errorResponse(401, '用户名或密码错误'))
      }
      throw error as Error
    }
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user!

    return response.json(
      successResponse({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    )
  }

  async logout({ auth, response }: HttpContext) {
    try {
      await auth.use('web').logout()
    } catch {
      // ignore
    }

    try {
      const user = auth.user
      if (user) {
        await User.accessTokens.delete(user, user.currentAccessToken?.identifier)
      }
    } catch {
      // ignore
    }

    return response.json(successResponse(null, '登出成功'))
  }
}
