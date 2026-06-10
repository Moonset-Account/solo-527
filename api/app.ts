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
import plotRoutes from './routes/plots.js'
import varietyRoutes from './routes/varieties.js'
import farmRecordRoutes from './routes/farmRecords.js'
import harvestRoutes from './routes/harvests.js'
import sortingOrderRoutes from './routes/sortingOrders.js'
import traceabilityRoutes from './routes/traceability.js'
import orderRoutes from './routes/orders.js'
import declarationRoutes from './routes/declarations.js'
import dashboardRoutes from './routes/dashboard.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/plots', plotRoutes)
app.use('/api/varieties', varietyRoutes)
app.use('/api/farm-records', farmRecordRoutes)
app.use('/api/harvests', harvestRoutes)
app.use('/api/sorting-orders', sortingOrderRoutes)
app.use('/api/traceability', traceabilityRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/declarations', declarationRoutes)
app.use('/api/dashboard', dashboardRoutes)
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
