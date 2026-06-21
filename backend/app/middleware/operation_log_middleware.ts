import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import OperationLogService from '#services/operation_log_service'

export default class OperationLogMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const method = ctx.request.method().toUpperCase()
    const shouldLog = ['PUT', 'POST', 'DELETE'].includes(method)

    const oldValues: Record<string, any> = {}
    if (shouldLog && (method === 'PUT' || method === 'DELETE')) {
      Object.assign(oldValues, ctx.request.all())
    }

    await next()

    if (!shouldLog) return

    try {
      const user = ctx.auth.user
      const userId = user?.id || null

      const route = ctx.route?.pattern || ctx.request.url()
      const methodLower = method.toLowerCase()
      const action = this.extractAction(route, methodLower)
      const resourceType = this.extractResourceType(route)

      const newValues: Record<string, any> = {}
      if (method === 'POST' || method === 'PUT') {
        Object.assign(newValues, ctx.request.all())
      }

      const request = {
        ip: ctx.request.ip(),
        url: ctx.request.url(),
        method,
        userAgent: ctx.request.header('user-agent'),
      }

      const responseStatus = ctx.response.getStatus()

      await OperationLogService.log(
        userId,
        action,
        resourceType,
        undefined,
        oldValues,
        { ...newValues, _responseStatus: responseStatus },
        request,
      )
    } catch (error) {
      ctx.logger.error({ err: error }, 'Failed to write operation log')
    }
  }

  private extractAction(route: string, method: string): string {
    const segments = route.split('/').filter((s) => s && !s.startsWith(':'))
    const lastSegment = segments[segments.length - 1] || 'unknown'

    const actionMap: Record<string, Record<string, string>> = {
      login: { post: 'auth.login' },
      logout: { post: 'auth.logout' },
      me: { get: 'auth.me' },
      generate: { post: 'email.generate' },
      'submit-review': { post: 'email.submit_review' },
      approve: { put: 'review.approve' },
      reject: { put: 'review.reject' },
      search: { post: 'knowledge.search', get: 'knowledge.search' },
      'create-version': { post: 'template.create_version' },
      'publish-version': { put: 'template.publish_version' },
      publish: { put: 'prompt.publish' },
      'mark-negative': { post: 'risk.mark_negative' },
    }

    if (actionMap[lastSegment] && actionMap[lastSegment][method]) {
      return actionMap[lastSegment][method]
    }

    const resourceSegment = segments[segments.length - 2] || segments[segments.length - 1] || 'unknown'
    const methodAction: Record<string, string> = {
      post: 'create',
      put: 'update',
      delete: 'delete',
      get: 'view',
    }

    return `${resourceSegment}.${methodAction[method] || method}`
  }

  private extractResourceType(route: string): string {
    const segments = route.split('/').filter((s) => s && !s.startsWith(':'))
    if (segments.length === 0) return 'unknown'

    const resourceMap: Record<string, string> = {
      auth: 'auth',
      emails: 'email_draft',
      knowledge: 'knowledge_item',
      templates: 'speech_template',
      prompts: 'prompt_version',
      reviews: 'review_record',
      risks: 'risk_sample',
      analytics: 'analytics',
      logs: 'operation_log',
    }

    return resourceMap[segments[0]] || segments[0]
  }
}
