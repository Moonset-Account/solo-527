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
import datasetRoutes from './routes/datasets.js'
import metricRoutes from './routes/metrics.js'
import approvalRoutes from './routes/approvals.js'
import subscriptionRoutes from './routes/subscriptions.js'
import exportRoutes from './routes/exports.js'
import historyRoutes from './routes/history.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// initialize database
import './db.js'

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
app.use('/api/datasets', datasetRoutes)
app.use('/api/metrics', metricRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/exports', exportRoutes)
app.use('/api/history', historyRoutes)

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
