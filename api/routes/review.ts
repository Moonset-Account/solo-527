import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'
import type { RequestStatus } from '../types.js'

const router = Router()

router.post('/:id/identity', (req: Request, res: Response): void => {
  const { id } = req.params
  const { result, remark, operatorId, operatorName, studentId, studentName, building, roomNumber } = req.body

  if (!result || !['pass', 'reject'].includes(result)) {
    res.status(400).json({ success: false, error: '审核结果必须是 pass 或 reject' })
    return
  }

  const request = store.repairRequests.getById(id)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }

  if (request.status !== 'identity_verifying') {
    res.status(400).json({ success: false, error: '当前状态不是身份审核中' })
    return
  }

  const previousValue = {
    studentId: '',
    studentName: '',
    building: '',
    roomNumber: '',
    reviewResult: '',
    reviewRemark: '',
  }

  const newValue = {
    studentId: studentId || request.studentId,
    studentName: studentName || request.studentName,
    building: building || request.building,
    roomNumber: roomNumber || request.roomNumber,
    reviewResult: result,
    reviewRemark: remark || '',
  }

  store.flowRecords.create({
    requestId: id,
    stepType: 'identity_review',
    previousValue,
    newValue,
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: operatorId || 'user-002',
    operatorName: operatorName || '宿管老师',
    remark: result === 'pass' ? '身份审核通过' : `身份审核不通过：${remark || '原因未说明'}`,
  })

  let newStatus: RequestStatus
  if (result === 'pass') {
    newStatus = 'quota_checking'
  } else {
    newStatus = 'rejected'
  }

  store.flowRecords.create({
    requestId: id,
    stepType: 'status_change',
    previousValue: { status: request.status },
    newValue: { status: newStatus },
    changedFields: ['status'],
    operatorId: operatorId || 'user-002',
    operatorName: operatorName || '宿管老师',
    remark: result === 'pass' ? '身份审核通过，进入名额检查' : '身份审核不通过，工单关闭',
  })

  store.repairRequests.update(id, { status: newStatus })

  store.notifications.create({
    userId: request.studentId,
    type: 'identity_result',
    title: result === 'pass' ? '身份审核通过' : '身份审核不通过',
    message: result === 'pass'
      ? `您的报修申请(${id})身份审核已通过`
      : `您的报修申请(${id})身份审核未通过，原因：${remark || '无'}`,
    relatedRequestId: id,
    isRead: false,
  })

  res.json({ success: true, data: store.repairRequests.getById(id) })
})

router.post('/:id/quota-check', (req: Request, res: Response): void => {
  const { id } = req.params
  const { operatorId, operatorName } = req.body

  const request = store.repairRequests.getById(id)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }

  if (request.status !== 'quota_checking') {
    res.status(400).json({ success: false, error: '当前状态不是名额检查中' })
    return
  }

  const quotaConfig = store.quotaConfigs.findByBuildingAndType(request.building, request.repairType)

  let newStatus: RequestStatus
  let quotaRemark: string

  if (!quotaConfig) {
    newStatus = 'assigned'
    quotaRemark = '未找到名额配置，直接进入分配'
  } else if (quotaConfig.currentUsed < quotaConfig.maxQuota) {
    newStatus = 'assigned'
    store.quotaConfigs.update(quotaConfig.id, { currentUsed: quotaConfig.currentUsed + 1 })
    quotaRemark = `名额检查通过，当前使用 ${quotaConfig.currentUsed + 1}/${quotaConfig.maxQuota}`
  } else {
    newStatus = 'waitlisted'
    quotaRemark = `名额已满(${quotaConfig.maxQuota}/${quotaConfig.maxQuota})，进入候补队列`
  }

  store.flowRecords.create({
    requestId: id,
    stepType: 'quota_check',
    previousValue: { quotaUsed: quotaConfig?.currentUsed ?? 0 },
    newValue: { quotaUsed: quotaConfig ? quotaConfig.currentUsed + (newStatus === 'assigned' ? 1 : 0) : 0 },
    changedFields: ['quotaUsed'],
    operatorId: operatorId || 'system',
    operatorName: operatorName || '系统',
    remark: quotaRemark,
  })

  store.flowRecords.create({
    requestId: id,
    stepType: 'status_change',
    previousValue: { status: request.status },
    newValue: { status: newStatus },
    changedFields: ['status'],
    operatorId: operatorId || 'system',
    operatorName: operatorName || '系统',
    remark: newStatus === 'assigned' ? '名额检查通过，待分配' : '名额已满，进入候补',
  })

  store.repairRequests.update(id, { status: newStatus, quotaConfigId: quotaConfig?.id || '' })

  if (newStatus === 'waitlisted' && quotaConfig) {
    store.notifications.create({
      userId: 'user-001',
      type: 'quota_alert',
      title: '名额预警',
      message: `${request.building}${request.repairType}类维修名额已满，新申请进入候补`,
      relatedRequestId: id,
      isRead: false,
    })
  }

  res.json({ success: true, data: store.repairRequests.getById(id) })
})

router.post('/:id/assign', (req: Request, res: Response): void => {
  const { id } = req.params
  const { assignedTo, operatorId, operatorName } = req.body

  if (!assignedTo) {
    res.status(400).json({ success: false, error: '缺少处理人' })
    return
  }

  const request = store.repairRequests.getById(id)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }

  if (request.status !== 'assigned' && request.status !== 'quota_checking') {
    res.status(400).json({ success: false, error: '当前状态不可分配' })
    return
  }

  const previousStatus = request.status

  store.flowRecords.create({
    requestId: id,
    stepType: 'status_change',
    previousValue: { status: previousStatus, assignedTo: request.assignedTo },
    newValue: { status: 'assigned', assignedTo },
    changedFields: ['status', 'assignedTo'],
    operatorId: operatorId || 'user-001',
    operatorName: operatorName || '系统管理员',
    remark: `分配给 ${assignedTo}`,
  })

  store.repairRequests.update(id, { status: 'assigned', assignedTo })

  res.json({ success: true, data: store.repairRequests.getById(id) })
})

router.post('/:id/complete', (req: Request, res: Response): void => {
  const { id } = req.params
  const { operatorId, operatorName, remark } = req.body

  const request = store.repairRequests.getById(id)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }

  if (request.status !== 'processing') {
    res.status(400).json({ success: false, error: '当前状态不是处理中' })
    return
  }

  store.flowRecords.create({
    requestId: id,
    stepType: 'repair_process',
    previousValue: { status: 'processing', progress: '维修中' },
    newValue: { status: 'completed', progress: '已完成' },
    changedFields: ['status', 'progress'],
    operatorId: operatorId || 'user-002',
    operatorName: operatorName || '宿管老师',
    remark: remark || '维修完成',
  })

  store.flowRecords.create({
    requestId: id,
    stepType: 'status_change',
    previousValue: { status: 'processing' },
    newValue: { status: 'completed' },
    changedFields: ['status'],
    operatorId: operatorId || 'user-002',
    operatorName: operatorName || '宿管老师',
    remark: '维修完成，工单关闭',
  })

  store.repairRequests.update(id, { status: 'completed' })

  const seatAssignments = store.seatAssignments.getByRequestId(id)
  for (const assignment of seatAssignments) {
    if (!assignment.releasedAt) {
      store.seatAssignments.update(assignment.id, { releasedAt: new Date().toISOString(), changeReason: '维修完成，释放临时座位' })
      const seat = store.seats.getById(assignment.seatId)
      if (seat) {
        store.seats.update(seat.id, { status: 'available' })
      }
    }
  }

  res.json({ success: true, data: store.repairRequests.getById(id) })
})

export default router
