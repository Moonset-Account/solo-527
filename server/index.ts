import express from 'express'
import cors from 'cors'
import compression from 'compression'
import { spatialRoutes } from './routes/spatial.js'
import { misuseRoutes } from './routes/misuse.js'
import { collectionRoutes } from './routes/collection.js'
import { auditRoutes } from './routes/audit.js'
import { publicRoutes } from './routes/public.js'
import { holidayRoutes } from './routes/holiday.js'
import { binPointRoutes } from './routes/binpoint.js'
import { inspectionRoutes } from './routes/inspection.js'
import { initDatabase } from './db.js'

const PORT = parseInt(process.env.API_PORT || '5194', 10)

async function main() {
  const db = await initDatabase()

  const app = express()
  app.use(cors())
  app.use(compression())
  app.use(express.json())

  app.use('/api/spatial', spatialRoutes(db))
  app.use('/api/misuse', misuseRoutes(db))
  app.use('/api/collection', collectionRoutes(db))
  app.use('/api/audit', auditRoutes(db))
  app.use('/api/public', publicRoutes(db))
  app.use('/api/holidays', holidayRoutes(db))
  app.use('/api/binpoints', binPointRoutes(db))
  app.use('/api/inspection', inspectionRoutes(db))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', clickhouse: 'simulated', timestamp: new Date().toISOString() })
  })

  app.listen(PORT, () => {
    console.log(`[ClickHouse API Server] running at http://localhost:${PORT}`)
    console.log(`[ClickHouse API Server] Simulated ClickHouse query engine ready`)
  })
}

main().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
