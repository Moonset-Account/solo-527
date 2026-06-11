import { Queue, Worker } from 'bullmq'
import getRedis from './redis'
import prisma from './prisma'
import { ExportStatus } from '@prisma/client'

let exportQueue: Queue | null = null

export const getExportQueue = () => {
  if (!exportQueue) {
    const connection = getRedis()
    exportQueue = new Queue('export-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    })
  }
  return exportQueue
}

const processExport = async (job: any) => {
  const { exportTaskId, filters, format } = job.data

  await prisma.exportTask.update({
    where: { id: exportTaskId },
    data: { status: ExportStatus.PROCESSING, progress: 0 },
  })

  try {
    const totalRecords = await prisma.productionRecord.count({
      where: buildWhere(filters),
    })

    await prisma.exportTask.update({
      where: { id: exportTaskId },
      data: { totalRecords, progress: 10 },
    })

    const batchSize = 100
    let processed = 0
    const records: any[] = []

    while (processed < totalRecords) {
      const batch = await prisma.productionRecord.findMany({
        where: buildWhere(filters),
        include: {
          user: { select: { name: true, email: true } },
          topic: { select: { title: true } },
          material: { select: { name: true, type: true } },
        },
        skip: processed,
        take: batchSize,
      })

      records.push(...batch)
      processed += batch.length

      const progress = Math.min(90, Math.floor((processed / totalRecords) * 90))
      await prisma.exportTask.update({
        where: { id: exportTaskId },
        data: {
          progress,
          processedRecords: processed
        },
      })

      await job.updateProgress(progress)
    }

    let fileContent = ''
    let fileName = ''
    let mimeType = ''

    if (format === 'CSV') {
      const headers = ['日期', '内容类型', '产出数量', '视频时长(秒)', '质量评分', '用户', '选题', '素材', '标签', '备注']
      const rows = records.map(r => [
        new Date(r.date).toLocaleDateString('zh-CN'),
        r.contentType,
        r.outputCount,
        r.videoDuration || '',
        r.qualityScore || '',
        r.user?.name || '',
        r.topic?.title || '',
        r.material?.name || '',
        r.tags.join(';'),
        r.remarks || '',
      ])
      fileContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      fileName = `产能记录_${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    } else if (format === 'EXCEL') {
      fileContent = JSON.stringify(records)
      fileName = `产能记录_${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else {
      fileContent = JSON.stringify(records)
      fileName = `产能记录_${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    }

    const fileUrl = `/exports/${exportTaskId}/${fileName}`

    await prisma.exportTask.update({
      where: { id: exportTaskId },
      data: {
        status: ExportStatus.COMPLETED,
        progress: 100,
        processedRecords: totalRecords,
        fileUrl,
        fileSize: Buffer.byteLength(fileContent, 'utf8'),
        completedAt: new Date(),
      },
    })

    return { success: true, fileUrl, totalRecords }
  } catch (error: any) {
    await prisma.exportTask.update({
      where: { id: exportTaskId },
      data: {
        status: ExportStatus.FAILED,
        errorMessage: error.message || '导出失败',
      },
    })
    throw error
  }
}

function buildWhere(filters: any) {
  const where: any = {}
  if (!filters) return where
  if (filters.startDate) where.date = { ...where.date, gte: new Date(filters.startDate) }
  if (filters.endDate) where.date = { ...where.date, lte: new Date(filters.endDate) }
  if (filters.userId) where.userId = filters.userId
  if (filters.contentType) where.contentType = filters.contentType
  if (filters.minQuality) where.qualityScore = { ...where.qualityScore, gte: parseInt(filters.minQuality) }
  if (filters.maxQuality) where.qualityScore = { ...where.qualityScore, lte: parseInt(filters.maxQuality) }
  return where
}

let workerInitialized = false

export function initWorker() {
  if (workerInitialized) return
  workerInitialized = true

  const connection = getRedis()
  const worker = new Worker('export-queue', processExport, {
    connection,
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`)
  })
}

export const addExportJob = async (
  exportTaskId: string,
  filters: any,
  format: string
) => {
  const queue = getExportQueue()
  return queue.add('export', {
    exportTaskId,
    filters,
    format,
  })
}
