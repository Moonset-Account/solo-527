import { Router } from 'express'
import * as reminderService from '../services/reminderService.js'
import type { RemindType, ReplyStatus } from '@prisma/client'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { contractId } = req.query
    if (!contractId) {
      res.status(400).json({ success: false, error: 'contractId is required' })
      return
    }
    const reminders = await reminderService.getRemindersByContract(Number(contractId))
    res.json({ success: true, data: reminders })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reminders' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { contractId, nodeId, remindType, remindContent, remindBy, remindTo } = req.body
    const reminder = await reminderService.createReminder({
      contractId,
      nodeId,
      remindType: remindType as RemindType,
      remindContent,
      remindBy,
      remindTo,
    })
    res.status(201).json({ success: true, data: reminder })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create reminder' })
  }
})

router.patch('/:id/reply', async (req, res) => {
  try {
    const { replyStatus } = req.body
    const reminder = await reminderService.updateReminderReply(
      Number(req.params.id),
      replyStatus as ReplyStatus
    )
    res.json({ success: true, data: reminder })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update reminder reply' })
  }
})

export default router
