import type { HttpContext } from '@adonisjs/core/http'
import OperationLogService from '#services/operation_log_service'
import { logIndexSchema } from '#validators/index'
import { successResponse } from '../utils/helpers.js'

export default class LogsController {
  private logService: OperationLogService

  constructor() {
    this.logService = OperationLogService.getInstance()
  }

  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(logIndexSchema)

    const result = await this.logService.index({
      page: payload.page,
      perPage: payload.perPage,
      userId: payload.userId,
      action: payload.action,
      resourceType: payload.resourceType,
      startDate: payload.startDate,
      endDate: payload.endDate,
    })

    const data = result.data.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: log.user
        ? {
            id: log.user.id,
            username: log.user.username,
            fullName: log.user.fullName,
            role: log.user.role,
          }
        : null,
      action: log.action,
      actionLabel: this.getActionLabel(log.action),
      resourceType: log.resourceType,
      resourceTypeLabel: this.getResourceTypeLabel(log.resourceType),
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      oldValues: this.sanitizeValues(log.oldValues),
      newValues: this.sanitizeValues(log.newValues),
      createdAt: log.createdAt,
    }))

    return response.json(successResponse(data, 'ok', result.pagination))
  }

  private getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'auth.login': '用户登录',
      'auth.logout': '用户登出',
      'auth.me': '获取用户信息',
      'email.generate': '生成邮件',
      'email.submit_review': '提交复核',
      'review.approve': '审核通过',
      'review.reject': '审核驳回',
      'knowledge.search': '知识库搜索',
      'knowledge_item.create': '创建知识库条目',
      'knowledge_item.update': '更新知识库条目',
      'knowledge_item.delete': '删除知识库条目',
      'speech_template.create': '创建话术模板',
      'speech_template.update': '更新话术模板',
      'speech_template.delete': '删除话术模板',
      'template.create_version': '创建话术版本',
      'template.publish_version': '发布话术版本',
      'prompt_version.create': '创建提示词版本',
      'prompt_version.update': '更新提示词版本',
      'prompt_version.delete': '删除提示词版本',
      'prompt.publish': '发布提示词',
      'risk.mark_negative': '标记风险样本',
      'risk_sample.create': '创建风险样本',
      'risk_sample.update': '更新风险样本',
      'risk_sample.delete': '删除风险样本',
    }
    return labels[action] || action
  }

  private getResourceTypeLabel(resourceType: string | null): string {
    if (!resourceType) return '未知'
    const labels: Record<string, string> = {
      auth: '认证',
      email_draft: '邮件草稿',
      knowledge_item: '知识库条目',
      speech_template: '话术模板',
      speech_template_version: '话术版本',
      prompt_version: '提示词版本',
      review_record: '复核记录',
      risk_sample: '风险样本',
      analytics: '统计分析',
      operation_log: '操作日志',
      cost_record: '成本记录',
    }
    return labels[resourceType] || resourceType
  }

  private sanitizeValues(values: Record<string, any> | null): Record<string, any> | null {
    if (!values) return null

    const sanitized: Record<string, any> = {}
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']

    for (const [key, value] of Object.entries(values)) {
      const lowerKey = key.toLowerCase()
      const isSensitive = sensitiveFields.some((f) => lowerKey.includes(f))

      if (isSensitive) {
        sanitized[key] = '***'
      } else if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + '...'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  async stats({ request, response }: HttpContext) {
    const days = Number(request.qs().days || 7)
    const safeDays = Math.min(365, Math.max(1, days))

    const stats = await this.logService.stats(safeDays)

    return response.json(
      successResponse(
        {
          days: safeDays,
          total: stats.total,
          byAction: Object.entries(stats.byAction).map(([action, count]) => ({
            action,
            actionLabel: this.getActionLabel(action),
            count,
          })),
          byResource: Object.entries(stats.byResource).map(([type, count]) => ({
            type,
            typeLabel: this.getResourceTypeLabel(type),
            count,
          })),
          byUser: stats.byUser,
          daily: stats.daily,
        },
        'ok',
      ),
    )
  }
}
