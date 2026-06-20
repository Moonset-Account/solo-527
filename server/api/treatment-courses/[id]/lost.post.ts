import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog, createDataSource } from '~/server/utils/audit'

const lostSchema = z.object({
  lostReason: z.string().min(1, '流失原因不能为空')
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR'])

  try {
    const courseId = parseInt(getRouterParam(event, 'id') || '0')
    const body = await readBody(event)
    const { lostReason } = lostSchema.parse(body)

    const oldCourse = await prisma.treatmentCourse.findUnique({
      where: { id: courseId }
    })

    if (!oldCourse) {
      return errorResponse('疗程不存在', 404)
    }

    if (oldCourse.isLost) {
      return errorResponse('该疗程已标记为流失', 400)
    }

    const course = await prisma.treatmentCourse.update({
      where: { id: courseId },
      data: {
        isLost: true,
        lostReason,
        lostDate: new Date(),
        lostHandlerId: user.id,
        status: 'LOST'
      }
    })

    await prisma.patient.update({
      where: { id: course.patientId },
      data: {
        status: 'LOST'
      }
    })

    await createAuditLog(user, {
      operationType: 'MARK_LOST',
      sourceType: 'TREATMENT_COURSE',
      sourceId: courseId,
      sourceNo: course.courseNo,
      oldValue: oldCourse,
      newValue: course,
      changeReason: `标记流失：${lostReason}`,
      patientId: course.patientId,
      courseId: courseId
    })

    await createDataSource(
      'TREATMENT_COURSE',
      courseId,
      course.courseNo,
      'PATIENT',
      course.patientId,
      '',
      'PATIENT_LOST',
      `疗程[${course.name}]标记流失，患者状态更新为流失`
    )

    const archiveNo = `ARC-LOST-${Date.now()}`
    await prisma.patientArchive.create({
      data: {
        archiveNo,
        patientId: course.patientId,
        archiveType: 'PATIENT_LOST',
        treatmentCourseId: courseId,
        summary: `疗程流失：${lostReason}`,
        content: {
          lostReason,
          lostDate: new Date(),
          handler: user.name,
          courseName: course.name,
          courseNo: course.courseNo
        }
      }
    })

    return successResponse(course, '流失处理成功，状态已沉淀')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '操作失败', 500)
  }
})
