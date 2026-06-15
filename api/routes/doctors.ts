import { Router, type Request, type Response } from 'express'
import Doctor from '../models/Doctor.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {}
    if (req.query.department) filter.department = req.query.department
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true'

    const doctors = await Doctor.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: doctors })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.create(req.body)
    res.status(201).json({ success: true, data: doctor })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor not found' })
      return
    }
    res.json({ success: true, data: doctor })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor not found' })
      return
    }
    res.json({ success: true, data: doctor })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router
