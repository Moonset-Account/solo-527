import { Router, type Request, type Response } from 'express'
import Service from '../models/Service.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {}
    if (req.query.category) filter.category = req.query.category

    const services = await Service.find(filter).sort({ category: 1, name: 1 })
    res.json({ success: true, data: services })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.create(req.body)
    res.status(201).json({ success: true, data: service })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }
    res.json({ success: true, data: service })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router
