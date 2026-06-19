import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager'])
  const body = await readBody(event)

  const { type, targetIds, params } = body

  if (!type || !targetIds || !Array.isArray(targetIds)) {
    throw createError({
      statusCode: 400,
      statusMessage: '操作类型和目标列表不能为空',
    })
  }

  let preview: any = {
    type,
    totalCount: targetIds.length,
    affectedItems: [],
    warnings: [],
  }

  switch (type) {
    case 'assign_inspection': {
      const projects = await prisma.project.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, name: true, status: true },
      })

      preview.affectedItems = projects.map(p => ({
        id: p.id,
        name: p.name,
        canExecute: p.status === 'in_progress',
        reason: p.status !== 'in_progress' ? '项目不在进行中状态' : null,
      }))

      const inspector = params?.inspectorId
        ? await prisma.user.findUnique({ where: { id: params.inspectorId }, select: { name: true } })
        : null

      preview.details = {
        inspectorName: inspector?.name || '未指定',
        scheduledAt: params?.scheduledAt || '未指定',
      }

      preview.warnings = preview.affectedItems
        .filter((item: any) => !item.canExecute)
        .map((item: any) => `${item.name}: ${item.reason}`)

      break
    }

    case 'update_status': {
      const projects = await prisma.project.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, name: true, status: true },
      })

      preview.affectedItems = projects.map(p => ({
        id: p.id,
        name: p.name,
        currentStatus: p.status,
        targetStatus: params?.status,
        canExecute: true,
      }))

      preview.details = {
        targetStatus: params?.status,
      }

      break
    }

    case 'notify_owner': {
      const projects = await prisma.project.findMany({
        where: { id: { in: targetIds } },
        include: { owner: { select: { name: true, phone: true } } },
      })

      preview.affectedItems = projects.map(p => ({
        id: p.id,
        name: p.name,
        ownerName: p.owner.name,
        ownerPhone: p.owner.phone,
        canExecute: true,
      }))

      preview.details = {
        message: params?.message?.substring(0, 50) + (params?.message?.length > 50 ? '...' : '') || '未指定消息',
      }

      break
    }

    default:
      throw createError({
        statusCode: 400,
        statusMessage: '不支持的操作类型',
      })
  }

  return preview
})
