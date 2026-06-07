import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

import { runMigrations } from './migrations'
import { seedIfEmpty } from './seed'
import { closeDb } from './database'
import { authMiddleware, requirePondAccess } from './authMiddleware'

import sensorRoutes from './routes/sensors'
import sensorStatusRoutes from './routes/sensorStatus'
import thresholdRoutes from './routes/thresholds'
import alertRoutes from './routes/alerts'
import feedingRoutes from './routes/feeding'
import batchRoutes from './routes/batches'
import aeratorRoutes from './routes/aerators'
import noteRoutes from './routes/notes'
import reportRoutes from './routes/reports'
import authRoutes from './routes/auth'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

runMigrations()
seedIfEmpty()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use('/api/sensors', authMiddleware, requirePondAccess, sensorRoutes)
app.use('/api/sensor-status', authMiddleware, sensorStatusRoutes)
app.use('/api/thresholds', authMiddleware, thresholdRoutes)
app.use('/api/alerts', authMiddleware, alertRoutes)
app.use('/api/feeding', authMiddleware, requirePondAccess, feedingRoutes)
app.use('/api/batches', authMiddleware, batchRoutes)
app.use('/api/aerators', authMiddleware, requirePondAccess, aeratorRoutes)
app.use('/api/notes', authMiddleware, noteRoutes)
app.use('/api/reports', authMiddleware, requirePondAccess, reportRoutes)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
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

process.on('SIGTERM', () => { closeDb() })
process.on('SIGINT', () => { closeDb() })

export default app
