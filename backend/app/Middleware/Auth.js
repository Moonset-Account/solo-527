import jsonwebtoken from 'jsonwebtoken'
import User from 'App/Models/User'

export default class Auth {
  async handle(ctx, next) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.response.status(401).json({
        code: 1,
        message: '未提供认证令牌',
      })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jsonwebtoken.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      )

      const user = await User.find(decoded.id)

      if (!user) {
        return ctx.response.status(401).json({
          code: 1,
          message: '认证令牌无效',
        })
      }

      if (user.status !== 'active') {
        return ctx.response.status(401).json({
          code: 1,
          message: '用户已被禁用',
        })
      }

      ctx.auth = ctx.auth || {}
      ctx.auth.user = user

      await next()
    } catch (error) {
      return ctx.response.status(401).json({
        code: 1,
        message: '认证令牌无效或已过期',
      })
    }
  }
}
