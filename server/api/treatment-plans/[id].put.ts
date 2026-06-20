import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog } from '~/server/utils/audit'

const planSchema = z.object({
  name: z.string().min(1, '方案名称不能为空'),
  description: z.string().optional(),
  type: z.string().min(1, '方案类型不能为空'),
  duration: z.number().int().positive(),
  frequency: z.string().min(1, '治疗频率不能为空'),
  items: z.object({
    treatments: z.array(z.string()),
    eachTime: z.number().int().positive()
  }),
  price: z.number().positive(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional(),
  remark: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR'])

  try {
    const id = parseInt(getRouterParam(event, 'id') || '0')
    const body = await readBody(event)
    const data = planSchema.parse(body)

    const oldPlan = await prisma.treatmentPlan.findUnique({ where: { id } })
    if (!oldPlan) {
      return errorResponse('疗程方案不存在', 404)
    }

    const plan = await prisma.treatmentPlan.update({
      where: { id },
      data
    })

    await createAuditLog(user, {
      operationType: 'UPDATE',
      sourceType: 'TREATMENT_PLAN',
      sourceId: plan.id,
      oldValue: oldPlan,
      newValue: plan,
      changeReason: '更新疗程方案'
    })

    return successResponse(plan, '更新成功')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '更新失败', 500)
  }
})
