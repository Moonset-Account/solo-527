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
import { initClickHouse, getClickHouseClient, getFallbackDb } from './clickhouse.js'

const PORT = parseInt(process.env.API_PORT || '5194', 10)

async function main() {
  const useClickHouse = await initClickHouse()

  const { connected } = await getClickHouseClient()
  const db = getFallbackDb()

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
    res.json({
      status: 'ok',
      clickhouse: connected ? 'connected' : 'fallback',
      clickhouseUrl: connected ? process.env.CLICKHOUSE_URL || 'http://localhost:8123' : 'not connected',
      timestamp: new Date().toISOString()
    })
  })

  app.listen(PORT, () => {
    console.log(`[ClickHouse API Server] running at http://localhost:${PORT}`)
    if (connected) {
      console.log(`[ClickHouse API Server] ✅ Connected to real ClickHouse at ${process.env.CLICKHOUSE_URL || 'http://localhost:8123'}`)
    } else {
      console.log(`[ClickHouse API Server] ⚠️  Using in-memory fallback (ClickHouse not available)`)
      console.log(`[ClickHouse API Server] To connect real ClickHouse: CLICKHOUSE_URL=http://host:8123 npm run server`)
    }
  })
}

main().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
