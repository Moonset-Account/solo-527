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
import kpiRoutes from './src/routes/kpi.js'
import temperatureRoutes from './src/routes/temperature.js'
import routeRoutes from './src/routes/route.js'
import exceptionRoutes from './src/routes/exception.js'
import compareRoutes from './src/routes/compare.js'
import dataQualityRoutes from './src/routes/dataQuality.js'
import filtersRoutes from './src/routes/filters.js'
import metaRoutes from './src/routes/meta.js'

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

app.use('/api/kpi', kpiRoutes)
app.use('/api/temperature', temperatureRoutes)
app.use('/api/route', routeRoutes)
app.use('/api/exception', exceptionRoutes)
app.use('/api/compare', compareRoutes)
app.use('/api/data-quality', dataQualityRoutes)
app.use('/api/filters', filtersRoutes)
app.use('/api/meta', metaRoutes)

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
