import { Router, type Request, type Response } from 'express'
import Note from '../models/Note.js'

const router = Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await Note.create({
      ...req.body,
      createdBy: req.body.createdBy || req.headers['x-operator-id'] as string || '',
    })
    res.status(201).json({ success: true, data: note })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!note) {
      res.status(404).json({ success: false, error: 'Note not found' })
      return
    }
    res.json({ success: true, data: note })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id)
    if (!note) {
      res.status(404).json({ success: false, error: 'Note not found' })
      return
    }
    res.json({ success: true, data: note })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {}
    if (req.query.relatedType) filter.relatedType = req.query.relatedType
    if (req.query.relatedId) filter.relatedId = req.query.relatedId

    const notes = await Note.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: notes })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
