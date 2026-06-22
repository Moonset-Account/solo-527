import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'
import { createLog } from '../../utils/logger'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const { deviceCode, deviceName, location, inspector, inspectionItems, result, issues } = body

  if (!deviceCode || !deviceName || !location || !inspector || !inspectionItems || !result) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要参数' })
  }

  const inspection = await prisma.deviceInspection.create({
    data: {
      deviceCode,
      deviceName,
      location,
      inspector,
      inspectionItems: inspectionItems as Prisma.InputJsonValue,
      result,
      issues
    }
  })

  await createLog({
    actionType: 'DEVICE_INSPECT',
    userId: user.id,
    deviceId: inspection.id,
    afterData: { deviceCode, deviceName, location, result },
    note: issues || `设备巡检: ${deviceName} - ${result}`
  })

  return inspection
})
