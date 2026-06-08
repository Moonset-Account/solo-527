import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initSchema, getDb } from './db.js'
import { getSchedulerStatus } from './scheduler.js'
import kpiRoutes from './routes/kpi.js'
import themeTrendsRoutes from './routes/theme-trends.js'
import branchCompareRoutes from './routes/branch-compare.js'
import reservationWaitRoutes from './routes/reservation-wait.js'
import overdueHeatmapRoutes from './routes/overdue-heatmap.js'
import weeklyReportsRoutes from './routes/weekly-reports.js'
import filterOptionsRoutes from './routes/filter-options.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initSchema()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/kpi', kpiRoutes)
app.use('/api/theme-trends', themeTrendsRoutes)
app.use('/api/branch-compare', branchCompareRoutes)
app.use('/api/reservation-wait', reservationWaitRoutes)
app.use('/api/overdue-heatmap', overdueHeatmapRoutes)
app.use('/api/weekly-reports', weeklyReportsRoutes)
app.use('/api/filter-options', filterOptionsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use('/api/update-time', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const row = db.prepare('SELECT MAX(updated_at) as updatedAt FROM update_log').get() as { updatedAt: string | null }
    res.json({ success: true, data: { updatedAt: row.updatedAt || new Date().toISOString() } })
  } catch {
    res.json({ success: true, data: { updatedAt: new Date().toISOString() } })
  }
})

app.use('/api/scheduler-status', (req: Request, res: Response): void => {
  res.json({ success: true, data: getSchedulerStatus() })
})

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

export default app
