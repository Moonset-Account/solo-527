import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

type ApprovalType = 'LEVEL_UPGRADE' | 'TAG_ADD' | 'ADVISOR_TRANSFER' | 'QUOTATION_APPROVE'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { type, targetIds = [], payload = {} } = body

  const validTypes: ApprovalType[] = ['LEVEL_UPGRADE', 'TAG_ADD', 'ADVISOR_TRANSFER', 'QUOTATION_APPROVE']
  if (!type || !validTypes.includes(type)) {
    return errorResponse('无效的审批类型 type，可选值：LEVEL_UPGRADE, TAG_ADD, ADVISOR_TRANSFER, QUOTATION_APPROVE')
  }

  if (!Array.isArray(targetIds) || targetIds.length === 0) {
    return errorResponse('缺少目标对象 ID 列表 targetIds')
  }

  const warnings: string[] = []
  const affectedObjects: any[] = []

  const [customers, levels, advisors, quotations, tags] = await Promise.all([
    mockPrisma.customer.findMany(),
    mockPrisma.customerLevel.findMany(),
    mockPrisma.advisor.findMany(),
    mockPrisma.quotation.findMany(),
    mockPrisma.tag.findMany(),
  ])

  switch (type) {
    case 'LEVEL_UPGRADE': {
      const newLevelId = payload.newLevelId
      if (!newLevelId) {
        return errorResponse('LEVEL_UPGRADE 类型需要提供 payload.newLevelId')
      }
      const newLevel = levels.find(l => l.id === newLevelId)
      if (!newLevel) {
        return errorResponse('指定的等级不存在')
      }

      for (const id of targetIds) {
        const customer = customers.find(c => c.id === id)
        if (!customer) {
          warnings.push(`客户ID ${id} 不存在，将跳过`)
          continue
        }
        const currentLevel = levels.find(l => l.id === customer.levelId)
        if (customer.levelId && parseFloat(currentLevel?.threshold || '0') >= parseFloat(newLevel.threshold)) {
          warnings.push(`客户「${customer.name}」当前等级(${currentLevel?.name || '普通'})不低于目标等级(${newLevel.name})，可能不需要升级`)
        }
        affectedObjects.push({
          id: customer.id,
          type: 'customer',
          name: customer.name,
          phone: customer.phone,
          originalLevel: currentLevel?.name || '普通客户',
          originalLevelId: customer.levelId,
          newLevel: newLevel.name,
          newLevelId: newLevel.id,
        })
      }
      break
    }

    case 'TAG_ADD': {
      const tagId = payload.tagId
      if (!tagId) {
        return errorResponse('TAG_ADD 类型需要提供 payload.tagId')
      }
      const tag = tags.find(t => t.id === tagId)
      if (!tag) {
        return errorResponse('指定的标签不存在')
      }

      for (const id of targetIds) {
        const customer = customers.find(c => c.id === id)
        if (!customer) {
          warnings.push(`客户ID ${id} 不存在，将跳过`)
          continue
        }
        if (customer.tagIds.includes(tagId)) {
          warnings.push(`客户「${customer.name}」已包含标签「${tag.name}」，将重复添加`)
        }
        affectedObjects.push({
          id: customer.id,
          type: 'customer',
          name: customer.name,
          phone: customer.phone,
          originalTags: customer.tagIds.map(tid => tags.find(t => t.id === tid)?.name).filter(Boolean),
          newTag: tag.name,
          newTagId: tag.id,
        })
      }
      break
    }

    case 'ADVISOR_TRANSFER': {
      const newAdvisorId = payload.newAdvisorId
      if (!newAdvisorId) {
        return errorResponse('ADVISOR_TRANSFER 类型需要提供 payload.newAdvisorId')
      }
      const newAdvisor = advisors.find(a => a.id === newAdvisorId)
      if (!newAdvisor) {
        return errorResponse('指定的顾问不存在')
      }

      for (const id of targetIds) {
        const customer = customers.find(c => c.id === id)
        if (!customer) {
          warnings.push(`客户ID ${id} 不存在，将跳过`)
          continue
        }
        const currentAdvisor = advisors.find(a => a.id === customer.advisorId)
        if (customer.advisorId === newAdvisorId) {
          warnings.push(`客户「${customer.name}」当前顾问已是「${newAdvisor.name}」，无需转移`)
        }
        if (currentAdvisor) {
          const advisorCustomerCount = customers.filter(c => c.advisorId === newAdvisorId).length
          if (advisorCustomerCount > 30) {
            warnings.push(`目标顾问「${newAdvisor.name}」已负责 ${advisorCustomerCount} 位客户，客户量较多，请确认`)
          }
        }
        affectedObjects.push({
          id: customer.id,
          type: 'customer',
          name: customer.name,
          phone: customer.phone,
          originalAdvisor: currentAdvisor?.name || '未分配',
          originalAdvisorId: customer.advisorId,
          newAdvisor: newAdvisor.name,
          newAdvisorId: newAdvisor.id,
        })
      }
      break
    }

    case 'QUOTATION_APPROVE': {
      for (const id of targetIds) {
        const quotation = quotations.find(q => q.id === id)
        if (!quotation) {
          warnings.push(`报价单ID ${id} 不存在，将跳过`)
          continue
        }
        const customer = customers.find(c => c.id === quotation.customerId)
        const advisor = advisors.find(a => a.id === quotation.advisorId)
        if (quotation.status === 'ACCEPTED') {
          warnings.push(`报价单 v${quotation.version}(客户:${customer?.name || '未知'}) 已是已接受状态，无需审批`)
        }
        if (quotation.status === 'EXPIRED') {
          warnings.push(`报价单 v${quotation.version}(客户:${customer?.name || '未知'}) 已过期，审批无效`)
        }
        const hasUnfinishedNodes = quotation.responseNodes.some(n => !n.doneAt)
        if (hasUnfinishedNodes) {
          warnings.push(`报价单 v${quotation.version} 存在未完成的响应节点，请确认`)
        }
        affectedObjects.push({
          id: quotation.id,
          type: 'quotation',
          version: quotation.version,
          customerName: customer?.name || '未知',
          customerId: quotation.customerId,
          advisorName: advisor?.name || '未知',
          totalAmount: quotation.totalAmount,
          originalStatus: quotation.status,
          expireAt: quotation.expireAt,
          pendingNodesCount: quotation.responseNodes.filter(n => !n.doneAt).length,
        })
      }
      break
    }
  }

  const typeLabels: Record<ApprovalType, string> = {
    LEVEL_UPGRADE: '批量等级升级',
    TAG_ADD: '批量添加标签',
    ADVISOR_TRANSFER: '批量顾问转移',
    QUOTATION_APPROVE: '批量报价审批',
  }

  return successResponse({
    type,
    typeLabel: typeLabels[type],
    totalCount: targetIds.length,
    validCount: affectedObjects.length,
    skipCount: targetIds.length - affectedObjects.length,
    warnings,
    affectedObjects,
    payload,
  })
})
