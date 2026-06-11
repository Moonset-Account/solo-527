import { prisma } from '~/server/utils/prisma'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!(await isDbAvailable())) {
    const timestamp = Date.now()
    return {
      filterSnapshot: body.filters ?? {},
      downloadUrl: `/exports/report-${timestamp}.xlsx`,
      generatedAt: new Date(),
      operator: body.operatorName,
    }
  }

  const timestamp = Date.now()
  const downloadUrl = `/exports/report-${timestamp}.xlsx`
  const now = new Date()

  const exportLog = await prisma.exportLog.create({
    data: {
      type: body.type,
      filterSnapshot: body.filters ?? {},
      operatorName: body.operatorName,
      downloadUrl,
      generatedAt: now,
    },
  })

  return {
    downloadUrl: exportLog.downloadUrl,
    filterSnapshot: exportLog.filterSnapshot,
    generatedAt: exportLog.generatedAt,
    operator: exportLog.operatorName,
  }
})
