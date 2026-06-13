import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'

const router = Router()

router.get('/:requestId', (req: Request, res: Response): void => {
  const { requestId } = req.params

  const request = store.repairRequests.getById(requestId)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }

  const records = store.flowRecords.getByRequestId(requestId)
  records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({
    success: true,
    data: {
      requestId,
      requestInfo: {
        studentName: request.studentName,
        building: request.building,
        roomNumber: request.roomNumber,
        repairType: request.repairType,
        status: request.status,
      },
      flowRecords: records,
    },
  })
})

export default router
