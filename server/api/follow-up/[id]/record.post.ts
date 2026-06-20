import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog, createDataSource } from '~/server/utils/audit'

const recordSchema = z.object({
  content: z.string().min(1, '随访内容不能为空'),
  contactResult: z.string().min(1, '联系结果不能为空'),
  nextFollowUp: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional()
  )
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR', 'DOCTOR'])

  try {
    const taskId = parseInt(getRouterParam(event, 'id') || '0')
    const body = await readBody(event)
    const data = recordSchema.parse(body)

    const task = await prisma.followUpTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return errorResponse('随访任务不存在', 404)
    }

    const record = await prisma.followUpRecord.create({
      data: {
        ...data,
        taskId,
        recordDate: new Date(),
        operatorId: user.id
      }
    })

    const updateData: any = {
      status: 'IN_PROGRESS'
    }

    if (data.nextFollowUp) {
      updateData.status = 'COMPLETED'
      updateData.completedDate = new Date()
      updateData.result = data.contactResult
    }

    const updatedTask = await prisma.followUpTask.update({
      where: { id: taskId },
      data: updateData
    })

    await createAuditLog(user, {
      operationType: 'ADD_RECORD',
      sourceType: 'FOLLOW_UP_TASK',
      sourceId: taskId,
      sourceNo: task.taskNo,
      newValue: record,
      changeReason: '添加随访记录',
      patientId: task.patientId,
      followUpId: taskId,
      courseId: task.courseId || undefined
    })

    await createDataSource(
      'FOLLOW_UP_TASK',
      taskId,
      task.taskNo,
      'FOLLOW_UP_RECORD',
      record.id,
      `REC${record.id}`,
      'FOLLOW_UP_HISTORY',
      `随访任务历史记录，操作者：${user.name}`
    )

    const archiveNo = `ARC-FOLLOW-${Date.now()}`
    await prisma.patientArchive.create({
      data: {
        archiveNo,
        patientId: task.patientId,
        archiveType: 'FOLLOW_UP_SUMMARY',
        followUpTaskId: taskId,
        treatmentCourseId: task.courseId || undefined,
        summary: `随访记录：${data.contactResult}`,
        content: {
          content: data.content,
          contactResult: data.contactResult,
          nextFollowUp: data.nextFollowUp,
          taskNo: task.taskNo
        }
      }
    })

    return successResponse({
      record,
      task: updatedTask
    }, '随访记录添加成功')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '操作失败', 500)
  }
})
