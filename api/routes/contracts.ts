import { Router } from 'express'
import * as contractService from '../services/contractService.js'
import type { ContractStatus } from '@prisma/client'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const contracts = await contractService.getContracts(status as ContractStatus | undefined)
    res.json({ success: true, data: contracts })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch contracts' })
  }
})

router.get('/stuck', async (_req, res) => {
  try {
    const stuckNodes = await contractService.getStuckNodes()
    res.json({ success: true, data: stuckNodes })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stuck nodes' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const contract = await contractService.getContractById(Number(req.params.id))
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    res.json({ success: true, data: contract })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch contract' })
  }
})

router.post('/', async (req, res) => {
  try {
    const contract = await contractService.createContract(req.body)
    res.status(201).json({ success: true, data: contract })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create contract' })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const contract = await contractService.updateContractStatus(Number(req.params.id), status)
    res.json({ success: true, data: contract })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update contract status' })
  }
})

export default router
