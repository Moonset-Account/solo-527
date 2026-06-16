import OperationLog from '#models/operation_log'
import type { HttpContext } from '@adonisjs/core/http'

export default class OperationLogService {
  static async log(
    ctx: HttpContext,
    action: string,
    resourceType: string,
    resourceId?: number,
    details?: Record<string, any>
  ) {
    const user = ctx.auth.user
    await OperationLog.create({
      userId: user?.id,
      userName: user?.fullName || user?.email,
      action,
      resourceType,
      resourceId,
      ipAddress: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      details,
    })
  }
}
