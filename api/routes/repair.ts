import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { store } from '../store.js'
import type { RepairRequest, RequestStatus } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.resolve(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  },
})

const upload = multer({ storage })

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const {
    status,
    building,
    repairType,
    urgency,
    keyword,
    page = '1',
    pageSize = '10',
    dateStart,
    dateEnd,
  } = req.query

  let results = store.repairRequests.getAll()

  if (status) {
    const statuses = (status as string).split(',')
    results = results.filter(r => statuses.includes(r.status))
  }
  if (building) {
    const buildings = (building as string).split(',')
    results = results.filter(r => buildings.includes(r.building))
  }
  if (repairType) {
    const types = (repairType as string).split(',')
    results = results.filter(r => types.includes(r.repairType))
  }
  if (urgency) {
    const urgencies = (urgency as string).split(',')
    results = results.filter(r => urgencies.includes(r.urgency))
  }
  if (dateStart) {
    results = results.filter(r => r.createdAt >= (dateStart as string))
  }
  if (dateEnd) {
    results = results.filter(r => r.createdAt <= (dateEnd as string))
  }
  if (keyword) {
    const kw = (keyword as string).toLowerCase()
    results = results.filter(r =>
      r.studentName.toLowerCase().includes(kw) ||
      r.description.toLowerCase().includes(kw) ||
      r.roomNumber.toLowerCase().includes(kw) ||
      r.building.toLowerCase().includes(kw)
    )
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const p = Math.max(1, parseInt(page as string, 10))
  const ps = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)))
  const total = results.length
  const start = (p - 1) * ps
  const data = results.slice(start, start + ps)

  res.json({
    success: true,
    data: {
      items: data,
      total,
      page: p,
      pageSize: ps,
      totalPages: Math.ceil(total / ps),
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const request = store.repairRequests.getById(req.params.id)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }
  res.json({ success: true, data: request })
})

router.post('/', (req: Request, res: Response): void => {
  const { studentId, studentName, building, roomNumber, repairType, description, urgency, quotaConfigId, photos: photoMetadata } = req.body

  if (!studentId || !building || !roomNumber || !repairType || !description || !urgency) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const request = store.repairRequests.create({
    studentId,
    studentName: studentName || '',
    building,
    roomNumber,
    repairType,
    description,
    urgency,
    status: 'pending',
    assignedTo: '',
    quotaConfigId: quotaConfigId || '',
    photos: [],
  })

  store.flowRecords.create({
    requestId: request.id,
    stepType: 'status_change',
    previousValue: {},
    newValue: { status: 'pending' },
    changedFields: ['status'],
    operatorId: studentId,
    operatorName: studentName || '学生',
    remark: '提交报修申请',
  })

  if (photoMetadata && Array.isArray(photoMetadata)) {
    for (const meta of photoMetadata) {
      const photo = store.photos.create({
        requestId: request.id,
        fileName: meta.fileName || 'unknown.jpg',
        filePath: meta.filePath || '',
        fileSize: meta.fileSize || 0,
      })
      request.photos.push(photo)
    }
  }

  store.notifications.create({
    userId: 'user-002',
    type: 'status_change',
    title: '新报修申请待审核',
    message: `${studentName || '学生'}提交了${building}${roomNumber}的报修申请，请尽快审核`,
    relatedRequestId: request.id,
    isRead: false,
  })

  res.status(201).json({ success: true, data: request })
})

router.put('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, operatorId, operatorName, remark } = req.body

  if (!status) {
    res.status(400).json({ success: false, error: '缺少状态字段' })
    return
  }

  const request = store.repairRequests.getById(id)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }

  const previousStatus = request.status
  if (previousStatus === status) {
    res.json({ success: true, data: request })
    return
  }

  store.flowRecords.create({
    requestId: id,
    stepType: 'status_change',
    previousValue: { status: previousStatus },
    newValue: { status },
    changedFields: ['status'],
    operatorId: operatorId || 'system',
    operatorName: operatorName || '系统',
    remark: remark || `状态从 ${previousStatus} 变更为 ${status}`,
  })

  store.repairRequests.update(id, { status: status as RequestStatus })

  res.json({ success: true, data: store.repairRequests.getById(id) })
})

router.post('/:id/photos', upload.array('photos', 5), (req: Request, res: Response): void => {
  const { id } = req.params
  const request = store.repairRequests.getById(id)
  if (!request) {
    res.status(404).json({ success: false, error: '报修申请不存在' })
    return
  }

  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ success: false, error: '未上传文件' })
    return
  }

  const newPhotos = []
  for (const file of files) {
    const photo = store.photos.create({
      requestId: id,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
    })
    newPhotos.push(photo)
  }

  request.photos.push(...newPhotos)
  res.status(201).json({ success: true, data: newPhotos })
})

router.get('/:id/photos/:photoId', (req: Request, res: Response): void => {
  const { id, photoId } = req.params
  const photo = store.photos.getById(photoId)

  if (!photo || photo.requestId !== id) {
    res.status(404).json({ success: false, error: '照片不存在' })
    return
  }

  res.sendFile(path.resolve(photo.filePath), (err) => {
    if (err) {
      res.status(404).json({ success: false, error: '文件不存在' })
    }
  })
})

export default router
