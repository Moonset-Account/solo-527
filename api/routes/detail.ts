import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'
import type { SeatUtilizationDetail, IdentityFailureDetail, ProcessingRecordDetail } from '../types.js'

const router = Router()

router.get('/seat-utilization', (_req: Request, res: Response): void => {
  const rooms = store.studyRooms.getAll()
  const allSeats = store.seats.getAll()
  const allAssignments = store.seatAssignments.getAll()

  const details: SeatUtilizationDetail[] = rooms.map(room => {
    const roomSeats = allSeats.filter(s => s.studyRoomId === room.id)
    const totalSeats = roomSeats.length || room.totalSeats
    const occupiedSeats = roomSeats.filter(s => s.status === 'occupied').length
    const utilizationRate = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0

    const roomAssignments = allAssignments.filter(a => {
      const seat = store.seats.getById(a.seatId)
      return seat && seat.studyRoomId === room.id && a.releasedAt
    })

    let totalDuration = 0
    for (const a of roomAssignments) {
      const assigned = new Date(a.assignedAt).getTime()
      const released = new Date(a.releasedAt!).getTime()
      totalDuration += (released - assigned) / 3600000
    }
    const averageDuration = roomAssignments.length > 0 ? totalDuration / roomAssignments.length : 0

    return {
      studyRoom: room.name,
      totalSeats,
      occupiedSeats,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageDuration: Math.round(averageDuration * 100) / 100,
    }
  })

  res.json({ success: true, data: details })
})

router.get('/identity-failures', (_req: Request, res: Response): void => {
  const allFlowRecords = store.flowRecords.getAll()
  const identityRejects = allFlowRecords.filter(
    f => f.stepType === 'identity_review' && f.newValue.reviewResult === 'reject'
  )

  const details: IdentityFailureDetail[] = identityRejects.map(f => {
    const request = store.repairRequests.getById(f.requestId)
    const allRecordsForRequest = store.flowRecords.getByRequestId(f.requestId)
    const retryCount = allRecordsForRequest.filter(r => r.stepType === 'identity_review').length - 1

    return {
      requestId: f.requestId,
      studentId: request?.studentId || f.newValue.studentId || '',
      studentName: request?.studentName || f.newValue.studentName || '',
      failureReason: f.newValue.reviewRemark || f.remark || '未说明原因',
      failedAt: f.createdAt,
      retryCount: Math.max(0, retryCount),
    }
  })

  res.json({ success: true, data: details })
})

router.get('/processing-records', (_req: Request, res: Response): void => {
  const requests = store.repairRequests.getAll()

  const details: ProcessingRecordDetail[] = requests.map(r => {
    const submittedAt = r.createdAt
    const completedAt = r.status === 'completed' ? r.updatedAt : null

    let processingDuration: number | null = null
    if (completedAt) {
      processingDuration = (new Date(completedAt).getTime() - new Date(submittedAt).getTime()) / 3600000
    }

    const OVERDUE_HOURS = 72
    const isOverdue = r.status === 'processing'
      ? (Date.now() - new Date(submittedAt).getTime()) / 3600000 > OVERDUE_HOURS
      : false

    return {
      requestId: r.id,
      repairType: r.repairType,
      submittedAt,
      completedAt,
      processingDuration: processingDuration !== null ? Math.round(processingDuration * 100) / 100 : null,
      isOverdue,
      handler: r.assignedTo || '',
    }
  })

  res.json({ success: true, data: details })
})

router.post('/export', (req: Request, res: Response): void => {
  const { type, dateRange } = req.body

  let csvContent = ''
  let fileName = ''

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '-'
    const str = String(val)
    if (str.includes(',') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  if (type === 'seat_utilization') {
    const rooms = store.studyRooms.getAll()
    const allSeats = store.seats.getAll()
    const allAssignments = store.seatAssignments.getAll()

    const headers = ['自习室', '总座位', '已占用', '利用率', '平均占用时长(小时)']
    const rows = rooms.map(room => {
      const roomSeats = allSeats.filter(s => s.studyRoomId === room.id)
      const totalSeats = roomSeats.length || room.totalSeats
      const occupiedSeats = roomSeats.filter(s => s.status === 'occupied').length
      const utilizationRate = totalSeats > 0 ? ((occupiedSeats / totalSeats) * 100).toFixed(1) + '%' : '0%'

      const roomAssignments = allAssignments.filter(a => {
        const seat = store.seats.getById(a.seatId)
        return seat && seat.studyRoomId === room.id && a.releasedAt
      })

      let totalDuration = 0
      for (const a of roomAssignments) {
        const assigned = new Date(a.assignedAt).getTime()
        const released = new Date(a.releasedAt!).getTime()
        totalDuration += (released - assigned) / 3600000
      }
      const averageDuration = roomAssignments.length > 0 ? (totalDuration / roomAssignments.length).toFixed(2) : '0'

      return [room.name, totalSeats, occupiedSeats, utilizationRate, averageDuration]
    })

    csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(formatValue).join(','))].join('\n')
    fileName = `seat_utilization_${Date.now()}.csv`
  } else if (type === 'identity_failure') {
    const allFlowRecords = store.flowRecords.getAll()
    const identityRejects = allFlowRecords.filter(
      f => f.stepType === 'identity_review' && f.newValue.reviewResult === 'reject'
    )

    const filtered = dateRange?.start && dateRange?.end
      ? identityRejects.filter(f => f.createdAt >= dateRange.start && f.createdAt <= dateRange.end)
      : identityRejects

    const headers = ['申请单号', '学生姓名', '学号', '失败原因', '失败时间', '重试次数']
    const rows = filtered.map(f => {
      const request = store.repairRequests.getById(f.requestId)
      const allRecordsForRequest = store.flowRecords.getByRequestId(f.requestId)
      const retryCount = Math.max(0, allRecordsForRequest.filter(r => r.stepType === 'identity_review').length - 1)

      return [
        f.requestId,
        request?.studentName || f.newValue.studentName || '',
        request?.studentId || f.newValue.studentId || '',
        f.newValue.reviewRemark || f.remark || '未说明原因',
        f.createdAt,
        retryCount,
      ]
    })

    csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(formatValue).join(','))].join('\n')
    fileName = `identity_failures_${Date.now()}.csv`
  } else if (type === 'processing_record') {
    const requests = store.repairRequests.getAll()

    const filtered = dateRange?.start && dateRange?.end
      ? requests.filter(r => r.createdAt >= dateRange.start && r.createdAt <= dateRange.end)
      : requests

    const headers = ['申请单号', '报修类型', '提交时间', '完成时间', '处理时长(小时)', '是否超时', '处理人']
    const rows = filtered.map(r => {
      const submittedAt = r.createdAt
      const completedAt = r.status === 'completed' ? r.updatedAt : null

      let processingDuration = '-'
      if (completedAt) {
        processingDuration = ((new Date(completedAt).getTime() - new Date(submittedAt).getTime()) / 3600000).toFixed(2)
      }

      const OVERDUE_HOURS = 72
      const isOverdue = r.status === 'processing'
        ? (Date.now() - new Date(submittedAt).getTime()) / 3600000 > OVERDUE_HOURS
        : false

      return [
        r.id,
        r.repairType,
        submittedAt,
        completedAt || '-',
        processingDuration,
        isOverdue ? '是' : '否',
        r.assignedTo || '-',
      ]
    })

    csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(formatValue).join(','))].join('\n')
    fileName = `processing_records_${Date.now()}.csv`
  } else {
    res.status(400).json({ success: false, error: '不支持的导出类型' })
    return
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
  res.send(csvContent)
})

export default router
