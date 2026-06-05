import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import './types.js'
import { auditMiddleware } from './middleware/audit.js'
import authRoutes from './routes/auth.js'
import courseRoutes from './routes/courses.js'
import sessionRoutes from './routes/sessions.js'
import bookingRoutes from './routes/bookings.js'
import schedulingRoutes from './routes/scheduling.js'
import checkinRoutes from './routes/checkin.js'
import teachingAidRoutes from './routes/teachingAids.js'
import feedbackRoutes from './routes/feedback.js'
import notificationRoutes from './routes/notifications.js'
import kanbanRoutes from './routes/kanban.js'
import auditLogRoutes from './routes/auditLogs.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api', auditMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/scheduling', schedulingRoutes)
app.use('/api/checkin', checkinRoutes)
app.use('/api/teaching-aids', teachingAidRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/kanban', kanbanRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  })
})

export default app
