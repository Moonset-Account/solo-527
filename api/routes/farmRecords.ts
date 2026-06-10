import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import FarmRecord from '../models/FarmRecord.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const uploadDir = path.join(process.cwd(), 'uploads', 'farm-records')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `farm-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {}
    if (req.query.plotId) filter.plotId = req.query.plotId
    if (req.query.varietyId) filter.varietyId = req.query.varietyId
    if (req.query.type) filter.type = req.query.type
    if (req.query.status) filter.status = req.query.status
    if (req.query.startDate || req.query.endDate) {
      filter.operateDate = {}
      if (req.query.startDate) filter.operateDate.$gte = new Date(req.query.startDate as string)
      if (req.query.endDate) filter.operateDate.$lte = new Date(req.query.endDate as string)
    }
    const list = await FarmRecord.find(filter)
      .populate('plotId', 'name code')
      .populate('varietyId', 'name')
      .populate('operator', 'name')
      .sort({ operateDate: -1 })
    const data = list.map((item: any) => ({
      id: item._id,
      type: item.type,
      plotId: item.plotId?._id,
      plotName: item.plotId?.name || '',
      varietyId: item.varietyId?._id,
      varietyName: item.varietyId?.name || '',
      content: item.content,
      dosage: item.dosage,
      unit: item.unit,
      operateDate: item.operateDate,
      operator: item.operator?.name || '',
      status: item.status,
      photos: item.photos || [],
      reviewer: item.reviewer,
      reviewDate: item.reviewDate,
      reviewRemark: item.reviewRemark,
    }))
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', authMiddleware, upload.array('photos', 9), async (req: Request, res: Response): Promise<void> => {
  try {
    const photos: string[] = []
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f: Express.Multer.File) => {
        photos.push(`/uploads/farm-records/${f.filename}`)
      })
    }
    const body = {
      ...req.body,
      dosage: req.body.dosage ? Number(req.body.dosage) : undefined,
      status: req.body.status || 'pending',
      operator: req.body.operator || req.user?.userId,
      photos,
    }
    const entry = await FarmRecord.create(body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await FarmRecord.findById(req.params.id)
      .populate('plotId', 'name code area')
      .populate('varietyId', 'name category')
      .populate('operator', 'name')
      .populate('reviewer', 'name')
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    const item: any = entry
    const data = {
      id: item._id,
      type: item.type,
      plotId: item.plotId?._id,
      plotName: item.plotId?.name || '',
      varietyId: item.varietyId?._id,
      varietyName: item.varietyId?.name || '',
      content: item.content,
      dosage: item.dosage,
      unit: item.unit,
      operateDate: item.operateDate,
      operator: item.operator?.name || '',
      status: item.status,
      photos: item.photos || [],
      reviewer: item.reviewer?.name || '',
      reviewDate: item.reviewDate,
      reviewRemark: item.reviewRemark,
    }
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, upload.array('photos', 9), async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: any = { ...req.body }
    if (req.body.dosage !== undefined) updateData.dosage = Number(req.body.dosage)
    if (req.files && Array.isArray(req.files)) {
      const newPhotos = req.files.map((f: Express.Multer.File) => `/uploads/farm-records/${f.filename}`)
      if (updateData.photos && typeof updateData.photos === 'string') {
        updateData.photos = [...JSON.parse(updateData.photos), ...newPhotos]
      } else {
        updateData.photos = newPhotos
      }
    }
    const entry = await FarmRecord.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/review', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.body.status || req.body.action
    const remark = req.body.remark || ''
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid review status' })
      return
    }
    const entry = await FarmRecord.findByIdAndUpdate(
      req.params.id,
      { status, reviewRemark: remark, reviewer: req.user?.userId, reviewDate: new Date() },
      { new: true, runValidators: true },
    )
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await FarmRecord.findByIdAndDelete(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
