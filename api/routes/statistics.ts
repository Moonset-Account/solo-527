import { Router } from 'express'
import * as statisticsService from '../services/statisticsService.js'

const router = Router()

router.get('/completeness', async (_req, res) => {
  try {
    const data = await statisticsService.getCompleteness()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch completeness stats' })
  }
})

router.get('/duration', async (_req, res) => {
  try {
    const data = await statisticsService.getDuration()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch duration stats' })
  }
})

router.get('/reminders', async (_req, res) => {
  try {
    const data = await statisticsService.getReminders()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reminder stats' })
  }
})

router.get('/timeout-rank', async (_req, res) => {
  try {
    const data = await statisticsService.getTimeoutRank()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch timeout rank' })
  }
})

export default router
