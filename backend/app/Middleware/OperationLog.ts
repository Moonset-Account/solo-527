import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OperationLog from 'App/Models/OperationLog'

export default class OperationLogMiddleware {
  public async handle(
    { auth, request, response }: HttpContextContract,
    next: () => Promise<void>,
    options: string[]
  ) {
    const [module, action] = options
    const isRiskRelated = options.length > 2 && options[2] === 'risk'

    await next()

    if (response.response.statusCode >= 200 && response.response.statusCode < 300) {
      const resourceType = request.param('resource_type') || request.url().split('/')[1]
      const paramId = request.param('id')
      const resourceId = paramId ? parseInt(paramId) : null

      await OperationLog.create({
        userId: auth.user?.id || null,
        action: action || request.method().toLowerCase(),
        module: module || 'system',
        resourceType,
        resourceId,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') || null,
        isRiskRelated,
      })
    }
  }
}
