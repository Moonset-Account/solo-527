import { Router } from 'express'
import prisma from '../prisma.js'

const router = Router()

router.get('/:contractNo', async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { contractNo: req.params.contractNo },
      include: {
        approvalNodes: {
          orderBy: { id: 'asc' },
        },
      },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    res.json({ success: true, data: contract })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch progress' })
  }
})

export default router
