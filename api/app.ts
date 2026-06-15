import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import doctorRoutes from './routes/doctors.js'
import scheduleRoutes from './routes/schedules.js'
import appointmentRoutes from './routes/appointments.js'
import serviceRoutes from './routes/services.js'
import closureRoutes from './routes/closures.js'
import reviewRoutes from './routes/review.js'
import exportRoutes from './routes/exports.js'
import auditLogRoutes from './routes/auditLogs.js'
import attachmentRoutes from './routes/attachments.js'
import noteRoutes from './routes/notes.js'
import { auditMiddleware } from './middleware/audit.js'
import { seedData } from './seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use(auditMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/closures', closureRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/exports', exportRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/attachments', attachmentRoutes)
app.use('/api/notes', noteRoutes)

app.post('/api/seed', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await seedData()
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

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
