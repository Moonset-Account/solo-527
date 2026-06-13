import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'
import type { BatchOperation, BatchResult, RequestStatus } from '../types.js'

const router = Router()

router.post('/process', (req: Request, res: Response): void => {
  const batch: BatchOperation = req.body

  if (!batch.requestIds || !Array.isArray(batch.requestIds) || batch.requestIds.length === 0) {
    res.status(400).json({ success: false, error: '缺少请求ID列表' })
    return
  }

  if (!batch.operation || !['approve', 'reject'].includes(batch.operation)) {
    res.status(400).json({ success: false, error: '操作类型必须是 approve 或 reject' })
    return
  }

  const result: BatchResult = {
    totalCount: batch.requestIds.length,
    successCount: 0,
    failCount: 0,
    successIds: [],
    failures: [],
  }

  for (const requestId of batch.requestIds) {
    const request = store.repairRequests.getById(requestId)
    if (!request) {
      result.failCount++
      result.failures.push({ requestId, reason: '报修申请不存在', retryable: false })
      continue
    }

    const validStatusesForApprove: RequestStatus[] = ['identity_verifying', 'quota_checking', 'assigned']
    const validStatusesForReject: RequestStatus[] = ['identity_verifying', 'quota_checking', 'assigned', 'pending']

    if (batch.operation === 'approve' && !validStatusesForApprove.includes(request.status)) {
      const canRetry = request.status === 'pending' || request.status === 'rejected' || request.status === 'waitlisted'
      result.failCount++
      result.failures.push({
        requestId,
        reason: `当前状态 ${request.status} 不可审批通过，建议先进行身份审核或重试`,
        retryable: canRetry,
      })
      continue
    }

    if (batch.operation === 'reject' && !validStatusesForReject.includes(request.status)) {
      const canRetry = request.status === 'rejected' || request.status === 'waitlisted'
      result.failCount++
      result.failures.push({
        requestId,
        reason: `当前状态 ${request.status} 不可拒绝`,
        retryable: canRetry,
      })
      continue
    }

    const previousStatus = request.status

    if (batch.operation === 'approve') {
      let newStatus: RequestStatus = 'assigned'
      if (request.status === 'identity_verifying') {
        store.flowRecords.create({
          requestId,
          stepType: 'identity_review',
          previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
          newValue: { studentId: request.studentId, studentName: request.studentName, building: request.building, roomNumber: request.roomNumber, reviewResult: 'pass', reviewRemark: '批量审核通过' },
          changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
          operatorId: 'user-002',
          operatorName: '宿管老师',
          remark: batch.remark || '批量审批通过-身份审核',
        })
        newStatus = 'quota_checking'

        const quotaConfig = store.quotaConfigs.findByBuildingAndType(request.building, request.repairType)
        if (quotaConfig && quotaConfig.currentUsed >= quotaConfig.maxQuota) {
          newStatus = 'waitlisted'
        } else if (quotaConfig) {
          store.quotaConfigs.update(quotaConfig.id, { currentUsed: quotaConfig.currentUsed + 1 })
          newStatus = 'assigned'
        }
      } else if (request.status === 'quota_checking') {
        const quotaConfig = store.quotaConfigs.findByBuildingAndType(request.building, request.repairType)
        if (quotaConfig && quotaConfig.currentUsed >= quotaConfig.maxQuota) {
          newStatus = 'waitlisted'
        } else {
          if (quotaConfig) {
            store.quotaConfigs.update(quotaConfig.id, { currentUsed: quotaConfig.currentUsed + 1 })
          }
          newStatus = 'assigned'
        }
      }

      store.flowRecords.create({
        requestId,
        stepType: 'status_change',
        previousValue: { status: previousStatus },
        newValue: { status: newStatus },
        changedFields: ['status'],
        operatorId: 'user-002',
        operatorName: '宿管老师',
        remark: batch.remark || `批量审批通过-状态从 ${previousStatus} 变更为 ${newStatus}`,
      })

      store.repairRequests.update(requestId, { status: newStatus })
    } else {
      store.flowRecords.create({
        requestId,
        stepType: 'identity_review',
        previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
        newValue: { studentId: request.studentId, studentName: request.studentName, building: request.building, roomNumber: request.roomNumber, reviewResult: 'reject', reviewRemark: batch.remark || '批量拒绝' },
        changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
        operatorId: 'user-002',
        operatorName: '宿管老师',
        remark: batch.remark || '批量拒绝-身份审核不通过',
      })

      store.flowRecords.create({
        requestId,
        stepType: 'status_change',
        previousValue: { status: previousStatus },
        newValue: { status: 'rejected' },
        changedFields: ['status'],
        operatorId: 'user-002',
        operatorName: '宿管老师',
        remark: batch.remark || '批量拒绝，工单关闭',
      })

      store.repairRequests.update(requestId, { status: 'rejected' })
    }

    result.successCount++
    result.successIds.push(requestId)
  }

  res.json({ success: true, data: result })
})

router.post('/retry', (req: Request, res: Response): void => {
  const { requestId, operation, remark } = req.body

  const result: BatchResult = {
    totalCount: 1,
    successCount: 0,
    failCount: 0,
    successIds: [],
    failures: [],
  }

  if (!requestId || !operation) {
    result.failCount = 1
    result.failures.push({ requestId: String(requestId || 'unknown'), reason: '缺少必填字段', retryable: true })
    res.json({ success: true, data: result })
    return
  }

  const request = store.repairRequests.getById(requestId)
  if (!request) {
    result.failCount = 1
    result.failures.push({ requestId, reason: '报修申请不存在', retryable: false })
    res.json({ success: true, data: result })
    return
  }

  if (request.status !== 'rejected' && request.status !== 'waitlisted') {
    const canRetry = request.status !== 'completed'
    result.failCount = 1
    result.failures.push({
      requestId,
      reason: `当前状态 ${request.status} 不可直接重试，${canRetry ? '可先调整申请状态后再重试' : '已完成的申请无法重试'}`,
      retryable: canRetry,
    })
    res.json({ success: true, data: result })
    return
  }

  const previousStatus = request.status
  const newStatus: RequestStatus = operation === 'approve' ? 'identity_verifying' : 'rejected'

  store.flowRecords.create({
    requestId,
    stepType: 'status_change',
    previousValue: { status: previousStatus },
    newValue: { status: newStatus },
    changedFields: ['status'],
    operatorId: 'user-002',
    operatorName: '宿管老师',
    remark: remark || `重试：状态从 ${previousStatus} 变更为 ${newStatus}`,
  })

  store.repairRequests.update(requestId, { status: newStatus })

  result.successCount = 1
  result.successIds.push(requestId)

  res.json({ success: true, data: result })
})

export default router
