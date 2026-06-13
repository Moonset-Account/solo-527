import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { userId } = req.query

  let notifications = store.notifications.getAll()

  if (userId) {
    notifications = notifications.filter(n => n.userId === userId)
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadCount = notifications.filter(n => !n.isRead).length

  res.json({
    success: true,
    data: {
      items: notifications,
      total: notifications.length,
      unreadCount,
    },
  })
})

router.post('/:id/read', (req: Request, res: Response): void => {
  const { id } = req.params

  const notification = store.notifications.getById(id)
  if (!notification) {
    res.status(404).json({ success: false, error: '通知不存在' })
    return
  }

  store.notifications.update(id, { isRead: true })

  res.json({ success: true, data: store.notifications.getById(id) })
})

export default router
