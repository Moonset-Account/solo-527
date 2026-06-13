/**
 * This is a API server
 */

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
import repairRoutes from './routes/repair.js'
import reviewRoutes from './routes/review.js'
import quotaRoutes from './routes/quota.js'
import checkinRoutes from './routes/checkin.js'
import flowRoutes from './routes/flow.js'
import detailRoutes from './routes/detail.js'
import batchRoutes from './routes/batch.js'
import notificationRoutes from './routes/notifications.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/repairs', repairRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/quotas', quotaRoutes)
app.use('/api/checkins', checkinRoutes)
app.use('/api/flow', flowRoutes)
app.use('/api/details', detailRoutes)
app.use('/api/batch', batchRoutes)
app.use('/api/notifications', notificationRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
