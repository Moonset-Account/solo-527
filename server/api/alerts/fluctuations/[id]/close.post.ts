import { findFluctuationIndex, findFluctuation, upsertFluctuation } from '~/server/utils/fluctuationsStore'
import type { Fluctuation } from '~/types'

interface ClosePayload {
  resolution: string
  closedById?: string
  closedByName?: string
}

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const body = await readBody(event) as ClosePayload

  if (!body.resolution || !body.resolution.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '关闭原因不能为空'
    })
  }

  const index = findFluctuationIndex(id)

  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: '异常记录不存在'
    })
  }

  const item = findFluctuation(id) as Fluctuation

  if (item.status === 'closed') {
    throw createError({
      statusCode: 409,
      statusMessage: '该异常已关闭，不可重复操作'
    })
  }

  const now = new Date().toISOString()

  const closedItem = upsertFluctuation(id, {
    status: 'closed',
    resolution: body.resolution.trim(),
    closedAt: now,
    assigneeId: item.assigneeId || resolveDefaultAssignee(item.source),
    assigneeName: item.assigneeName || resolveDefaultAssigneeName(item.source)
  })

  if (item.source === 'api_error') {
    notifySupplyChainManager(closedItem)
  }

  syncToMonthlyReport(closedItem)

  return {
    success: true,
    message: '异常已关闭',
    data: {
      id: closedItem.id,
      status: closedItem.status,
      resolution: closedItem.resolution,
      closedAt: closedItem.closedAt,
      assigneeId: closedItem.assigneeId,
      assigneeName: closedItem.assigneeName,
      syncedToReport: true,
      supplyChainNotified: item.source === 'api_error'
    }
  }
})

function resolveDefaultAssignee(source: string): string {
  if (source === 'api_error') return 'user_supply'
  return 'user_business'
}

function resolveDefaultAssigneeName(source: string): string {
  if (source === 'api_error') return '赵供应'
  return '王业务'
}

function notifySupplyChainManager(fluctuation: Fluctuation) {
  console.log(
    `[通知] 供应链经理(赵供应)：接口错误类异常已关闭 — ${fluctuation.title}`,
    `| 原因: ${fluctuation.readableReason}`,
    `| 处理结果: ${fluctuation.resolution}`,
    `| 关闭时间: ${fluctuation.closedAt}`
  )
}

function syncToMonthlyReport(fluctuation: Fluctuation) {
  const month = fluctuation.closedAt
    ? new Date(fluctuation.closedAt).toISOString().slice(0, 7)
    : new Date().toISOString().slice(0, 7)

  console.log(
    `[月度复盘] 异常已同步 — 月份: ${month}`,
    `| 标题: ${fluctuation.title}`,
    `| 来源: ${fluctuation.source}`,
    `| 优先级: ${fluctuation.priority}`,
    `| 负责人: ${fluctuation.assigneeName}`,
    `| 处理结果: ${fluctuation.resolution}`,
    `| 发现时间: ${fluctuation.detectedAt}`,
    `| 关闭时间: ${fluctuation.closedAt}`
  )
}
