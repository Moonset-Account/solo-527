import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import routes from './routes.js'
import { ReminderService } from './services/ReminderService.js'

const app = express()
const PORT = process.env.PORT || 3333

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')))

app.use('/api', routes)

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: '请求体格式错误' })
  }
  console.error(err)
  return res.status(500).json({ error: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`API 地址: http://localhost:${PORT}/api`)
})

const reminderService = new ReminderService()

setInterval(async () => {
  try {
    await reminderService.checkOverdueReminders()
  } catch (err) {
    console.error('自动提醒检查失败:', err)
  }
}, 5 * 60 * 1000)

export default app
