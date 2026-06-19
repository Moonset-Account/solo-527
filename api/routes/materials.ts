import { Router } from 'express'
import * as materialService from '../services/materialService.js'
import type { MaterialStatus } from '@prisma/client'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { contractId } = req.query
    if (!contractId) {
      res.status(400).json({ success: false, error: 'contractId is required' })
      return
    }
    const materials = await materialService.getMaterialsByContract(Number(contractId))
    res.json({ success: true, data: materials })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch materials' })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const material = await materialService.updateMaterialStatus(
      Number(req.params.id),
      status as MaterialStatus
    )
    res.json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update material status' })
  }
})

router.post('/batch-remind', async (req, res) => {
  try {
    const { materialIds } = req.body
    if (!Array.isArray(materialIds) || materialIds.length === 0) {
      res.status(400).json({ success: false, error: 'materialIds must be a non-empty array' })
      return
    }
    const reminders = await materialService.batchRemind(materialIds)
    res.status(201).json({ success: true, data: reminders })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to batch remind' })
  }
})

export default router
