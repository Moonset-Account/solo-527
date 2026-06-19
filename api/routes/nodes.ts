import { Router } from 'express'
import * as nodeService from '../services/nodeService.js'
import type { NodeStatus } from '@prisma/client'

const router = Router()

router.get('/:id', async (req, res) => {
  try {
    const node = await nodeService.getNodeById(Number(req.params.id))
    if (!node) {
      res.status(404).json({ success: false, error: 'Node not found' })
      return
    }
    res.json({ success: true, data: node })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch node' })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const node = await nodeService.updateNodeStatus(Number(req.params.id), status as NodeStatus)
    res.json({ success: true, data: node })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update node status' })
  }
})

export default router
