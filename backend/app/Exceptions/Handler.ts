import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'

export default class ExceptionHandler extends HttpExceptionHandler {
  protected statusPages = {
    '403': 'errors/unauthorized',
    '404': 'errors/not-found',
    '500..599': 'errors/server-error',
  }

  constructor() {
    super(Logger)
  }

  public async handle(error: any, ctx: HttpContextContract) {
    if (ctx.request.accepts(['json'])) {
      ctx.response.status(error.status || 500).send({
        message: error.message || 'Internal Server Error',
        code: error.code || 'E_SERVER_ERROR',
        status: error.status || 500,
      })
      return
    }
    return super.handle(error, ctx)
  }
}
