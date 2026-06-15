import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

type ApprovalType = 'LEVEL_UPGRADE' | 'TAG_ADD' | 'ADVISOR_TRANSFER' | 'QUOTATION_APPROVE'
type ApprovalItemResult = 'PENDING' | 'SUCCESS' | 'FAILED'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { type, targetIds = [], payload = {} } = body

  const validTypes: ApprovalType[] = ['LEVEL_UPGRADE', 'TAG_ADD', 'ADVISOR_TRANSFER', 'QUOTATION_APPROVE']
  if (!type || !validTypes.includes(type)) {
    return errorResponse('无效的审批类型 type')
  }

  if (!Array.isArray(targetIds) || targetIds.length === 0) {
    return errorResponse('缺少目标对象 ID 列表 targetIds')
  }

  const results: {
    targetId: number
    targetName: string
    result: ApprovalItemResult
    originalStatus: string
    failReason?: string
  }[] = []

  const [customers, levels, advisors] = await Promise.all([
    mockPrisma.customer.findMany(),
    mockPrisma.customerLevel.findMany(),
    mockPrisma.advisor.findMany(),
  ])

  const failPattern = [false, false, true, false, false]

  let index = 0

  switch (type) {
    case 'LEVEL_UPGRADE': {
      const newLevelId = payload.newLevelId
      const newLevel = levels.find(l => l.id === newLevelId)
      if (!newLevel) return errorResponse('指定的等级不存在')

      for (const id of targetIds) {
        const customer = customers.find(c => c.id === id)
        const shouldFail = failPattern[index % failPattern.length] && index >= 2
        index++

        if (!customer) {
          results.push({
            targetId: id,
            targetName: `未知客户(${id})`,
            result: 'FAILED',
            originalStatus: 'NOT_FOUND',
            failReason: '客户不存在',
          })
          continue
        }

        const currentLevel = levels.find(l => l.id === customer.levelId)

        if (shouldFail) {
          results.push({
            targetId: id,
            targetName: customer.name,
            result: 'FAILED',
            originalStatus: currentLevel?.name || '普通客户',
            failReason: '系统异常：等级更新事务冲突，请稍后重试',
          })
          continue
        }

        await mockPrisma.customer.update({
          where: { id },
          data: { levelId: newLevelId },
        })

        results.push({
          targetId: id,
          targetName: customer.name,
          result: 'SUCCESS',
          originalStatus: currentLevel?.name || '普通客户',
        })
      }
      break
    }

    case 'TAG_ADD': {
      const tagId = payload.tagId
      const tag = (await mockPrisma.tag.findMany()).find(t => t.id === tagId)
      if (!tag) return errorResponse('指定的标签不存在')

      for (const id of targetIds) {
        const customer = customers.find(c => c.id === id)
        const shouldFail = failPattern[index % failPattern.length] && index % 4 === 3
        index++

        if (!customer) {
          results.push({
            targetId: id,
            targetName: `未知客户(${id})`,
            result: 'FAILED',
            originalStatus: 'NOT_FOUND',
            failReason: '客户不存在',
          })
          continue
        }

        const originalTags = customer.tagIds
          .map(tid => (mockPrisma.tag.findMany() as any).then((tags: any[]) => tags.find((t: any) => t.id === tid)?.name))

        if (shouldFail) {
          results.push({
            targetId: id,
            targetName: customer.name,
            result: 'FAILED',
            originalStatus: customer.tagIds.length + '个标签',
            failReason: '标签关联失败：数据库锁超时',
          })
          continue
        }

        const newTagIds = Array.from(new Set([...customer.tagIds, tagId]))
        await mockPrisma.customer.update({
          where: { id },
          data: { tagIds: newTagIds },
        })

        results.push({
          targetId: id,
          targetName: customer.name,
          result: 'SUCCESS',
          originalStatus: customer.tagIds.length + '个标签',
        })
      }
      break
    }

    case 'ADVISOR_TRANSFER': {
      const newAdvisorId = payload.newAdvisorId
      const newAdvisor = advisors.find(a => a.id === newAdvisorId)
      if (!newAdvisor) return errorResponse('指定的顾问不存在')

      for (const id of targetIds) {
        const customer = customers.find(c => c.id === id)
        const shouldFail = failPattern[index % failPattern.length] && index === 1
        index++

        if (!customer) {
          results.push({
            targetId: id,
            targetName: `未知客户(${id})`,
            result: 'FAILED',
            originalStatus: 'NOT_FOUND',
            failReason: '客户不存在',
          })
          continue
        }

        const currentAdvisor = advisors.find(a => a.id === customer.advisorId)

        if (shouldFail) {
          results.push({
            targetId: id,
            targetName: customer.name,
            result: 'FAILED',
            originalStatus: currentAdvisor?.name || '未分配',
            failReason: '权限验证失败：当前用户无权转移该客户',
          })
          continue
        }

        await mockPrisma.customer.update({
          where: { id },
          data: { advisorId: newAdvisorId },
        })

        results.push({
          targetId: id,
          targetName: customer.name,
          result: 'SUCCESS',
          originalStatus: currentAdvisor?.name || '未分配',
        })
      }
      break
    }

    case 'QUOTATION_APPROVE': {
      const quotations = await mockPrisma.quotation.findMany()
      for (const id of targetIds) {
        const quotation = quotations.find(q => q.id === id)
        const shouldFail = failPattern[index % failPattern.length] && index % 3 === 2
        index++

        if (!quotation) {
          results.push({
            targetId: id,
            targetName: `未知报价(${id})`,
            result: 'FAILED',
            originalStatus: 'NOT_FOUND',
            failReason: '报价单不存在',
          })
          continue
        }

        const customer = customers.find(c => c.id === quotation.customerId)

        if (quotation.status === 'EXPIRED') {
          results.push({
            targetId: id,
            targetName: `${customer?.name || '未知'} - v${quotation.version}`,
            result: 'FAILED',
            originalStatus: quotation.status,
            failReason: '报价单已过期，无法审批',
          })
          continue
        }

        if (shouldFail) {
          results.push({
            targetId: id,
            targetName: `${customer?.name || '未知'} - v${quotation.version}`,
            result: 'FAILED',
            originalStatus: quotation.status,
            failReason: '审批流异常：未找到前置审批节点记录',
          })
          continue
        }

        quotation.status = 'ACCEPTED'
        quotation.updatedAt = new Date().toISOString()

        results.push({
          targetId: id,
          targetName: `${customer?.name || '未知'} - v${quotation.version}`,
          result: 'SUCCESS',
          originalStatus: quotation.status,
        })
      }
      break
    }
  }

  const successList = results.filter(r => r.result === 'SUCCESS')
  const failedList = results.filter(r => r.result === 'FAILED')

  const typeLabels: Record<ApprovalType, string> = {
    LEVEL_UPGRADE: '批量等级升级',
    TAG_ADD: '批量添加标签',
    ADVISOR_TRANSFER: '批量顾问转移',
    QUOTATION_APPROVE: '批量报价审批',
  }

  return successResponse({
    type,
    typeLabel: typeLabels[type],
    totalCount: results.length,
    successCount: successList.length,
    failedCount: failedList.length,
    successRate: results.length > 0 ? Number(((successList.length / results.length) * 100).toFixed(2)) : 0,
    successList,
    failedList,
  })
})
