import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate, generateOrderNo } from '../../utils/helpers'
import type { NotificationType } from '@prisma/client'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const method = event.method
    const query = getQuery(event)

    if (method === 'GET') {
      const page = Number(query.page) || 1
      const pageSize = Number(query.pageSize) || 30
      const isRead = query.isRead !== undefined ? query.isRead === 'true' : undefined
      const type = query.type as NotificationType | undefined
      const unreadOnly = query.unread === 'true'

      const where: any = { userId: auth.id }
      if (unreadOnly) where.isRead = false
      else if (isRead !== undefined) where.isRead = isRead
      if (type) where.type = type

      const result = await paginate(
        prisma.notification, page, pageSize, where,
        undefined,
        { createdAt: 'desc' }
      )

      const unreadCount = await prisma.notification.count({
        where: { userId: auth.id, isRead: false }
      })

      return successResponse({ ...result, unreadCount })
    }

    if (method === 'PUT') {
      const id = query.id ? Number(query.id) : undefined
      const markAll = query.markAll === 'true'

      if (markAll) {
        await prisma.notification.updateMany({
          where: { userId: auth.id, isRead: false },
          data: { isRead: true, readAt: new Date() }
        })
        return successResponse(null, '全部已读')
      }

      if (!id) return errorResponse('参数错误', 400)
      const notif = await prisma.notification.findUnique({ where: { id } })
      if (!notif) return errorResponse('通知不存在', 404)
      if (notif.userId !== auth.id) return errorResponse('无权限', 403)

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() }
      })
      return successResponse(updated)
    }

    return errorResponse('不支持的方法', 405)
  } catch (e: any) {
    return errorResponse(e.message || '操作失败', 500)
  }
})
