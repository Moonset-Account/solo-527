import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog, createDataSource } from '~/server/utils/audit'
import { cacheDel } from '~/server/utils/redis'

const recordSchema = z.object({
  patientId: z.number().int().positive(),
  visitDate: z.coerce.date(),
  chiefComplaint: z.string().min(1, '主诉不能为空'),
  presentIllness: z.string().min(1, '现病史不能为空'),
  pastHistory: z.string().optional(),
  diagnosis: z.string().min(1, '诊断不能为空'),
  prescription: z.string().optional(),
  treatment: z.string().optional(),
  summary: z.string().optional(),
  remark: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'DOCTOR'])

  try {
    const body = await readBody(event)
    const data = recordSchema.parse(body)

    const recordNo = `MR${String(Date.now()).slice(-8)}`

    const record = await prisma.medicalRecord.create({
      data: {
        ...data,
        recordNo,
        createdBy: user.id,
        updatedBy: user.id
      }
    })

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { patientNo: true, name: true }
    })

    await createAuditLog(user, {
      operationType: 'CREATE',
      sourceType: 'MEDICAL_RECORD',
      sourceId: record.id,
      sourceNo: record.recordNo,
      newValue: record,
      changeReason: '创建病历',
      patientId: data.patientId,
      medicalRecordId: record.id
    })

    await createDataSource(
      'PATIENT',
      data.patientId,
      patient?.patientNo || '',
      'MEDICAL_RECORD',
      record.id,
      record.recordNo,
      'CREATE_RECORD',
      `患者[${patient?.name}]的就诊病历`
    )

    await prisma.patient.update({
      where: { id: data.patientId },
      data: {
        lastVisitDate: new Date()
      }
    })

    const archiveNo = `ARC-MR-${Date.now()}`
    await prisma.patientArchive.create({
      data: {
        archiveNo,
        patientId: data.patientId,
        archiveType: 'MANUAL',
        medicalRecordId: record.id,
        summary: `就诊记录：${data.diagnosis}`,
        content: {
          chiefComplaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          visitDate: data.visitDate,
          recordNo: record.recordNo
        }
      }
    })

    await cacheDel('patients:*')
    await cacheDel('medical-records:*')

    return successResponse(record, '创建成功')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '创建失败', 500)
  }
})
