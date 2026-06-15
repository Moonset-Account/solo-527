import { Router, type Request, type Response } from 'express'
import Schedule from '../models/Schedule.js'
import { cacheGet, cacheSet, cacheDel } from '../db/redis.js'

const router = Router()

function getCacheKey(query: Record<string, any>): string {
  return `schedules:${JSON.stringify(query)}`
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {}
    if (req.query.date) filter.date = req.query.date
    if (req.query.doctorId) filter.doctorId = req.query.doctorId
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: req.query.startDate as string, $lte: req.query.endDate as string }
    }

    const cacheKey = getCacheKey(req.query)
    const cached = await cacheGet(cacheKey)
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) })
      return
    }

    const schedules = await Schedule.find(filter)
      .populate('doctorId', 'name title department')
      .populate('timeSlotId', 'startTime endTime label')
      .sort({ date: 1, createdAt: -1 })

    await cacheSet(cacheKey, JSON.stringify(schedules), 60)
    res.json({ success: true, data: schedules })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Schedule.findOne({
      doctorId: req.body.doctorId,
      date: req.body.date,
      timeSlotId: req.body.timeSlotId,
    })
    if (existing) {
      res.status(409).json({ success: false, error: 'Schedule conflict: this doctor already has a schedule for this date and time slot' })
      return
    }

    const schedule = await Schedule.create(req.body)
    await cacheDel('schedules:')
    res.status(201).json({ success: true, data: schedule })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!schedule) {
      res.status(404).json({ success: false, error: 'Schedule not found' })
      return
    }
    await cacheDel('schedules:')
    res.json({ success: true, data: schedule })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id)
    if (!schedule) {
      res.status(404).json({ success: false, error: 'Schedule not found' })
      return
    }
    await cacheDel('schedules:')
    res.json({ success: true, data: schedule })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = req.body
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'Request body must be an array of schedule objects' })
      return
    }

    const results = []
    const errors = []

    for (const item of items) {
      const existing = await Schedule.findOne({
        doctorId: item.doctorId,
        date: item.date,
        timeSlotId: item.timeSlotId,
      })
      if (existing) {
        errors.push({ item, error: 'Schedule conflict' })
        continue
      }
      const schedule = await Schedule.create(item)
      results.push(schedule)
    }

    await cacheDel('schedules:')
    res.status(201).json({ success: true, data: { created: results, errors } })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router
