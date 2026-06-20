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
  remark: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR'])

  try {
    const body = await readBody(event)
    const data = planSchema.parse(body)

    const planNo = `PLAN${String(Date.now()).slice(-6)}`

    const plan = await prisma.treatmentPlan.create({
      data: {
        ...data,
        planNo,
        status: 'ACTIVE'
      }
    })

    await createAuditLog(user, {
      operationType: 'CREATE',
      sourceType: 'TREATMENT_PLAN',
      sourceId: plan.id,
      newValue: plan,
      changeReason: '创建疗程方案'
    })

    return successResponse(plan, '创建成功')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '创建失败', 500)
  }
})
