import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import Attachment from '../models/Attachment.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' })
      return
    }

    const { relatedType, relatedId } = req.body
    if (!relatedType || !relatedId) {
      res.status(400).json({ success: false, error: 'relatedType and relatedId are required' })
      return
    }

    const attachment = await Attachment.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      url: `/uploads/${req.file.filename}`,
      relatedType,
      relatedId,
      uploadedBy: (req.headers['x-operator-id'] as string) || '',
    })

    res.status(201).json({ success: true, data: attachment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const attachment = await Attachment.findById(req.params.id)
    if (!attachment) {
      res.status(404).json({ success: false, error: 'Attachment not found' })
      return
    }
    res.json({ success: true, data: attachment })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const attachment = await Attachment.findByIdAndDelete(req.params.id)
    if (!attachment) {
      res.status(404).json({ success: false, error: 'Attachment not found' })
      return
    }

    const filePath = path.join(__dirname, '..', '..', attachment.url)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.json({ success: true, data: attachment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export { upload }
export default router
