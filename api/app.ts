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
import contractRoutes from './routes/contracts.js'
import nodeRoutes from './routes/nodes.js'
import reminderRoutes from './routes/reminders.js'
import materialRoutes from './routes/materials.js'
import statisticsRoutes from './routes/statistics.js'
import progressRoutes from './routes/progress.js'
import { startTimeoutChecker } from './services/timeoutChecker.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/nodes', nodeRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/progress', progressRoutes)

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

startTimeoutChecker()

export default app
