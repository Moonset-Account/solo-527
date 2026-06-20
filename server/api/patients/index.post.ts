import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog } from '~/server/utils/audit'
import { cacheDel } from '~/server/utils/redis'

const patientSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.string().min(1, '性别不能为空'),
  age: z.number().int().positive().optional(),
  phone: z.string().min(1, '手机号不能为空'),
  idCard: z.string().optional(),
  address: z.string().optional(),
  source: z.string().optional(),
  remark: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR', 'DOCTOR'])

  try {
    const body = await readBody(event)
    const data = patientSchema.parse(body)

    const patientNo = `P${String(Date.now()).slice(-6)}`

    const patient = await prisma.patient.create({
      data: {
        ...data,
        patientNo,
        status: 'ACTIVE',
        firstVisitDate: new Date()
      }
    })

    await createAuditLog(user, {
      operationType: 'CREATE',
      sourceType: 'PATIENT',
      sourceId: patient.id,
      newValue: patient,
      changeReason: '创建患者档案'
    })

    await cacheDel('patients:*')

    return successResponse(patient, '创建成功')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '创建失败', 500)
  }
})
