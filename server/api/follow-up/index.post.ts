import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog, createDataSource } from '~/server/utils/audit'

const taskSchema = z.object({
  patientId: z.number().int().positive(),
  courseId: z.number().int().positive().optional(),
  type: z.enum(['PHONE', 'WECHAT', 'VISIT', 'OTHER']),
  scheduledDate: z.coerce.date(),
  priority: z.number().int().min(1).max(3).default(1),
  content: z.string().optional(),
  assignedTo: z.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR'])

  try {
    const body = await readBody(event)
    const data = taskSchema.parse(body)

    const taskNo = `FU${String(Date.now()).slice(-8)}`

    const task = await prisma.followUpTask.create({
      data: {
        ...data,
        taskNo,
        createdBy: user.id,
        status: 'PENDING'
      }
    })

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { patientNo: true, name: true }
    })

    await createAuditLog(user, {
      operationType: 'CREATE',
      sourceType: 'FOLLOW_UP_TASK',
      sourceId: task.id,
      newValue: task,
      changeReason: '创建随访任务'
    })

    await createDataSource(
      'PATIENT',
      data.patientId,
      patient?.patientNo || '',
      'FOLLOW_UP_TASK',
      task.id,
      task.taskNo,
      'CREATE_FOLLOW_UP',
      `患者[${patient?.name}]的随访任务`
    )

    if (data.courseId) {
      const course = await prisma.treatmentCourse.findUnique({
        where: { id: data.courseId },
        select: { courseNo: true, name: true }
      })
      await createDataSource(
        'TREATMENT_COURSE',
        data.courseId,
        course?.courseNo || '',
        'FOLLOW_UP_TASK',
        task.id,
        task.taskNo,
        'COURSE_FOLLOW_UP',
        `疗程[${course?.name}]的随访任务`
      )
    }

    return successResponse(task, '创建成功')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '创建失败', 500)
  }
})
