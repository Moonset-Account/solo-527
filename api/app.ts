import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getDb } from './db/database.js'
import { runMigrations } from './db/database.js'
import { authMiddleware, type AuthRequest } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import memberRoutes from './routes/members.js'
import coachRoutes from './routes/coaches.js'
import packageRoutes from './routes/packages.js'
import appointmentRoutes from './routes/appointments.js'
import freezeRoutes from './routes/freezes.js'
import groupClassRoutes from './routes/groupClasses.js'
import bodyTestRoutes from './routes/bodyTests.js'
import messageRoutes from './routes/messages.js'
import renewalRoutes from './routes/renewal.js'
import auditLogRoutes from './routes/auditLogs.js'
import scheduleRoutes from './routes/schedules.js'
import uploadRoutes from './routes/upload.js'
import * as messageService from './services/messageService.js'
import * as renewalService from './services/renewalService.js'
import logger from './utils/logger.js'
import type { DashboardStats, Appointment } from '../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

runMigrations()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/coaches', coachRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/freezes', freezeRoutes)
app.use('/api/group-classes', groupClassRoutes)
app.use('/api/body-tests', bodyTestRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/renewal', renewalRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/api/dashboard', authMiddleware, (req: AuthRequest, res: Response): void => {
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)
  const user = req.user!

  const todayPrivateCount = (db.prepare(`
    SELECT COUNT(*) as cnt FROM appointments
    WHERE type = 'private' AND status != 'cancelled' AND start_time LIKE ?
  `).get(`${today}%`) as { cnt: number }).cnt

  const todayGroupCount = (db.prepare(`
    SELECT COUNT(*) as cnt FROM appointments
    WHERE type = 'group' AND status != 'cancelled' AND start_time LIKE ?
  `).get(`${today}%`) as { cnt: number }).cnt

  const pendingFreezeCount = (db.prepare(`
    SELECT COUNT(*) as cnt FROM freezes WHERE status = 'pending'
  `).get() as { cnt: number }).cnt

  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const expiringMemberCount = (db.prepare(`
    SELECT COUNT(DISTINCT member_id) as cnt FROM member_packages
    WHERE status = 'active' AND expiry_date <= ?
  `).get(thirtyDaysLater) as { cnt: number }).cnt

  const unreadMessageCount = messageService.getUnreadCount(user.id)

  const stats: DashboardStats = {
    todayPrivateCount,
    todayGroupCount,
    pendingFreezeCount,
    expiringMemberCount,
    unreadMessageCount,
  }

  if (user.role === 'admin') {
    const coachPerformance = db.prepare(`
      SELECT c.id, c.name,
        COUNT(a.id) as sessions,
        COALESCE(SUM(mp.paid_amount / mp.total_sessions), 0) as revenue
      FROM coaches c
      LEFT JOIN appointments a ON a.coach_id = c.id AND a.status = 'checked_in'
      LEFT JOIN member_packages mp ON a.member_package_id = mp.id
      GROUP BY c.id
      ORDER BY revenue DESC
    `).all() as { id: number; name: string; sessions: number; revenue: number }[]

    stats.coachPerformance = coachPerformance.map(cp => ({
      ...cp,
      revenue: Math.round(cp.revenue * 100) / 100,
    }))

    stats.renewalFunnel = renewalService.getRenewalFunnel()
  }

  if (user.role === 'admin' || user.role === 'receptionist' || user.role === 'coach') {
    const todayAppointments = db.prepare(`
      SELECT * FROM appointments
      WHERE start_time LIKE ? AND status != 'cancelled'
      ORDER BY start_time ASC
    `).all(`${today}%`) as Appointment[]
    stats.todayAppointments = todayAppointments
  }

  if (user.role === 'coach' && user.coach_id) {
    const coachStats = db.prepare(`
      SELECT COUNT(a.id) as sessions,
        COALESCE(SUM(mp.paid_amount / mp.total_sessions), 0) as revenue
      FROM appointments a
      LEFT JOIN member_packages mp ON a.member_package_id = mp.id
      WHERE a.coach_id = ? AND a.status = 'checked_in'
    `).get(user.coach_id) as { sessions: number; revenue: number }

    stats.coachPerformance = [{
      id: user.coach_id,
      name: user.name,
      sessions: coachStats.sessions,
      revenue: Math.round(coachStats.revenue * 100) / 100,
    }]
  }

  res.json({ success: true, data: stats })
})

app.use(
  '/api/health',
  (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack, path: req.path })
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
