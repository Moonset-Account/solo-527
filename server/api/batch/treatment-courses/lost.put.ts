import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { batchResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog, createDataSource } from '~/server/utils/audit'

const batchSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '请选择至少一条记录'),
  lostReason: z.string().min(1, '流失原因不能为空')
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR'])

  try {
    const body = await readBody(event)
    const { ids, lostReason } = batchSchema.parse(body)

    const totalCount = ids.length
    let successCount = 0
    let failCount = 0
    const failedItems: any[] = []

    const batchOp = await prisma.batchOperation.create({
      data: {
        batchNo: `BATCH${String(Date.now()).slice(-8)}`,
        operationType: 'BATCH_MARK_LOST',
        totalCount,
        status: 'PROCESSING',
        operatorId: user.id,
        parameters: { ids, lostReason }
      }
    })

    for (const id of ids) {
      try {
        const oldCourse = await prisma.treatmentCourse.findUnique({
          where: { id }
        })

        if (!oldCourse) {
          failCount++
          failedItems.push({ id, error: '疗程不存在' })
          continue
        }

        if (oldCourse.isLost) {
          failCount++
          failedItems.push({ id, error: '该疗程已标记为流失' })
          continue
        }

        const course = await prisma.treatmentCourse.update({
          where: { id },
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
          data: { status: 'LOST' }
        })

        await createAuditLog(user, {
          operationType: 'BATCH_MARK_LOST',
          sourceType: 'TREATMENT_COURSE',
          sourceId: id,
          sourceNo: course.courseNo,
          oldValue: oldCourse,
          newValue: course,
          changeReason: lostReason,
          patientId: course.patientId,
          courseId: id
        })

        await createDataSource(
          'TREATMENT_COURSE',
          id,
          course.courseNo,
          'PATIENT',
          course.patientId,
          '',
          'PATIENT_LOST',
          `疗程[${course.name}]标记流失`
        )

        const archiveNo = `ARC-LOST-BATCH-${id}-${Date.now()}`
        await prisma.patientArchive.create({
          data: {
            archiveNo,
            patientId: course.patientId,
            archiveType: 'PATIENT_LOST',
            treatmentCourseId: id,
            summary: `批量标记流失：${lostReason}`,
            content: {
              lostReason,
              lostDate: new Date(),
              handler: user.name,
              courseName: course.name,
              courseNo: course.courseNo,
              batchNo: batchOp.batchNo
            }
          }
        })

        successCount++
      } catch (err: any) {
        failCount++
        failedItems.push({ id, error: err.message || '操作失败' })
      }
    }

    await prisma.batchOperation.update({
      where: { id: batchOp.id },
      data: {
        successCount,
        failCount,
        status: failCount > 0 ? (successCount > 0 ? 'COMPLETED' : 'FAILED') : 'COMPLETED',
        failedItems,
        completedAt: new Date()
      }
    })

    return batchResponse(
      successCount,
      failCount,
      failedItems,
      { batchId: batchOp.id },
      `批量标记流失完成：成功 ${successCount} 条，失败 ${failCount} 条`
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '批量操作失败', 500)
  }
})
