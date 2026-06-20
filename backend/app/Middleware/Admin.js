export default class Admin {
  async handle(ctx, next) {
    if (!ctx.auth || !ctx.auth.user) {
      return ctx.response.status(401).json({
        code: 1,
        message: '未认证',
      })
    }

    if (ctx.auth.user.role !== 'admin') {
      return ctx.response.status(403).json({
        code: 1,
        message: '权限不足',
      })
    }

    await next()
  }
}
