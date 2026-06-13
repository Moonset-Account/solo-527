import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import alertRoutes from './routes/alerts.js'
import accountRequestRoutes from './routes/account-requests.js'
import inspectionRoutes from './routes/inspections.js'
import dutyRoutes from './routes/duty.js'
import recordRoutes from './routes/records.js'
import reportRoutes from './routes/reports.js'
import auditLogRoutes from './routes/audit-logs.js'
import userRoutes from './routes/users.js'
import { AppError } from './lib/errors.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/account-requests', accountRequestRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/duty', dutyRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/users', userRoutes)

app.use('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      detail: err.detail,
    })
    return
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      code: 'TOKEN_EXPIRED',
      message: '登录已过期，请重新登录',
    })
    return
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: '提交的数据格式有误',
      detail: err.message,
    })
    return
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: '服务器内部错误，请稍后重试',
  })
})

app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: '请求的资源不存在',
  })
})

export default app
