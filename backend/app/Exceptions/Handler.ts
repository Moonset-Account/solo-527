import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ExceptionHandler extends HttpExceptionHandler {
  constructor() {
    super(Logger)
  }

  public async handle(error: any, ctx: HttpContextContract) {
    if (error.code === 'E_VALIDATION_FAILURE') {
      return ctx.response.status(422).json({
        message: '数据验证失败',
        errors: error.messages,
      })
    }

    if (error.code === 'E_ROW_NOT_FOUND') {
      return ctx.response.status(404).json({
        message: '资源不存在',
      })
    }

    if (error.code === 'E_UNAUTHORIZED_ACCESS') {
      return ctx.response.status(401).json({
        message: '未授权访问',
      })
    }

    return super.handle(error, ctx)
  }
}
