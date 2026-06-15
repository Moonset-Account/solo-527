import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole, generateOrderNo } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { reason } = body

  if (!reason) {
    return errorResponse('请填写拒绝原因')
  }

  const visitor = await prisma.visitorAppointment.findUnique({ where: { id } })
  if (!visitor) {
    return errorResponse('访客预约不存在', 404)
  }

  if (visitor.status !== 'PENDING') {
    return errorResponse('此预约状态不允许审核')
  }

  const updated = await prisma.visitorAppointment.update({
    where: { id },
    data: {
      status: 'REJECTED',
      handlerId: user.id,
      rejectReason: reason
    }
  })

  const impactScope = JSON.stringify({
    direct: [
      '访客本人无法进入园区',
      '已安排的访客行程计划作废'
    ],
    indirect: [
      '被访租户接待计划受阻',
      '可能影响业务洽谈或合作会议',
      '租户方内部协调成本增加'
    ],
    related: [
      '前台登记流程需调整该访客登记状态',
      '安保检查系统需更新访客白名单',
      '园区停车位预留需取消（如有）'
    ]
  })

  const processOrder = JSON.stringify([
    {
      step: 1,
      action: '通知被访租户',
      description: '第一时间联系被访租户，告知访客预约被拒情况，协商是否需要重新预约或其他安排',
      responsible: '前台接待',
      status: 'PENDING'
    },
    {
      step: 2,
      action: '联系访客说明原因',
      description: '向访客详细说明拒绝原因，提供后续申请的指导和建议，保持礼貌与专业',
      responsible: '运营人员',
      status: 'PENDING'
    },
    {
      step: 3,
      action: '更新系统记录',
      description: '确保异常记录完整，包括原因、影响范围和处理措施，同步至租户服务档案',
      responsible: '运营人员',
      status: 'PENDING'
    },
    {
      step: 4,
      action: '跟进后续处理',
      description: '如访客需要重新申请，提供协助；如租户有异议，进行协调处理；如涉及多部门，召开协调会',
      responsible: '运营主管',
      status: 'PENDING'
    },
    {
      step: 5,
      action: '归档与复盘',
      description: '将完整处理记录归档，定期复盘审核规则，优化访客预约流程',
      responsible: '管理员',
      status: 'PENDING'
    }
  ])

  await prisma.auditException.create({
    data: {
      exceptionNo: generateOrderNo('EXC'),
      type: 'VISITOR_REJECT',
      sourceType: 'VISITOR',
      sourceId: id,
      relatedNo: visitor.visitNo,
      title: `访客审核拒绝 - ${visitor.visitorName}`,
      detail: reason,
      impactScope,
      impactLevel: 'MEDIUM',
      priority: 'MEDIUM',
      processOrder,
      suggestion: '请联系租户核实情况，如访客需要重新申请，指导其补充完整材料后再次提交。如有特殊紧急情况，可联系上级主管进行特殊审批。涉及重要访客或重大业务时，需立即通知运营主管介入处理。',
      creatorId: user.id,
      handlerId: user.id,
      handledAt: new Date()
    }
  })

  return successResponse(updated, '已拒绝，异常记录已生成')
})
