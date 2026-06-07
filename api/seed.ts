import { getDb } from './database'
import crypto from 'crypto'

function uuid(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

function isoNow(): string {
  return new Date().toISOString()
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString()
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function seedIfEmpty(): void {
  const db = getDb()

  const count = db.prepare('SELECT COUNT(*) as c FROM sensor_status').get() as { c: number }
  if (count.c > 0) return

  console.log('Seeding database...')

  const now = Date.now()
  const ponds = ['pond-1', 'pond-2', 'pond-3', 'pond-4']
  const metrics: Array<'dissolved_oxygen' | 'temperature' | 'ph'> = ['dissolved_oxygen', 'temperature', 'ph']
  const baseValues: Record<string, number> = { dissolved_oxygen: 7.2, temperature: 26.5, ph: 7.8 }
  const ranges: Record<string, number> = { dissolved_oxygen: 1.5, temperature: 3, ph: 0.6 }

  const insertReading = db.prepare(`
    INSERT INTO sensor_readings (id, sensor_id, pond_id, metric, value, ts, is_anomaly, quality)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertThreshold = db.prepare(`
    INSERT OR IGNORE INTO thresholds (id, metric, pond_id, warning_low, warning_high, critical_low, critical_high)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSensorStatus = db.prepare(`
    INSERT INTO sensor_status (sensor_id, pond_id, type, status, last_heartbeat, last_reading)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertBatch = db.prepare(`
    INSERT INTO pond_batches (id, pond_id, batch_name, species, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAerator = db.prepare(`
    INSERT INTO aerator_status (id, pond_id, status, last_switch_at, auto_mode)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, type, severity, metric, pond_id, value, threshold_value, triggered_at, status, acknowledged_by, acknowledged_at, human_judgment, judgment_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertFeeding = db.prepare(`
    INSERT INTO feeding_records (id, pond_id, batch_id, amount, feed_type, ts, strategy_change, strategy_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertNote = db.prepare(`
    INSERT INTO processing_notes (id, alert_id, reading_id, note, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, display_name, role, pond_scope, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const seedTx = db.transaction(() => {
    for (const pondId of ponds) {
      for (const metric of metrics) {
        const base = baseValues[metric]
        const range = ranges[metric]
        const sensorId = `${pondId}-${metric}-sensor`
        const count = 144

        for (let i = 0; i < count; i++) {
          const ts = new Date(now - (count - i) * 10 * 60000).toISOString()
          const hourIndex = i / 6
          let quality = 'good'
          let isAnomaly = 0
          let value: number | null = Math.round((base + (Math.random() - 0.5) * range) * 100) / 100

          if (hourIndex >= 13 && hourIndex <= 15) {
            quality = 'offline'
            value = null
          }

          if (metric === 'dissolved_oxygen' && hourIndex > 12 && hourIndex < 14 && quality !== 'offline') {
            value = Math.round((4.2 + Math.random() * 0.3) * 100) / 100
            isAnomaly = 1
            quality = 'suspect'
          }

          if (metric === 'temperature' && hourIndex > 8 && hourIndex < 9 && quality !== 'offline') {
            value = Math.round((31.5 + Math.random() * 0.5) * 100) / 100
            isAnomaly = 1
            quality = 'suspect'
          }

          insertReading.run(uuid(), sensorId, pondId, metric, value, ts, isAnomaly, quality)
        }

        const offlineSensor = (pondId === 'pond-1' && metric === 'ph') || (pondId === 'pond-3' && metric === 'dissolved_oxygen')
        insertSensorStatus.run(
          sensorId, pondId, metric,
          offlineSensor ? 'offline' : 'online',
          offlineSensor ? hoursAgo(offlineSensor ? (pondId === 'pond-3' ? 4 : 2) : 0) : isoNow(),
          offlineSensor ? null : Math.round((base + (Math.random() - 0.5) * range) * 100) / 100
        )
      }

      const isCritical = pondId === 'pond-1' ? 5.0 : (pondId === 'pond-4' ? 4.5 : 5.0)
      const isWarnLow = pondId === 'pond-4' ? 5.0 : 5.5
      const tempCritHigh = pondId === 'pond-4' ? 35.0 : 33.0
      const tempWarnHigh = pondId === 'pond-4' ? 32.0 : 30.0

      insertThreshold.run(`th-${pondId}-do`, 'dissolved_oxygen', pondId, isWarnLow, 12.0, isCritical, 14.0)
      insertThreshold.run(`th-${pondId}-temp`, 'temperature', pondId, pondId === 'pond-4' ? 18.0 : 15.0, tempWarnHigh, pondId === 'pond-4' ? 12.0 : 10.0, tempCritHigh)
      insertThreshold.run(`th-${pondId}-ph`, 'ph', pondId, 6.5, 8.5, 6.0, 9.0)
    }

    insertBatch.run('batch-1', 'pond-1', '1号塘-草鱼2024春', '草鱼', '2024-03-15', null, 'active')
    insertBatch.run('batch-2', 'pond-2', '2号塘-鲤鱼2024春', '鲤鱼', '2024-03-20', null, 'active')
    insertBatch.run('batch-3', 'pond-3', '3号塘-鲫鱼2024春', '鲫鱼', '2024-04-01', null, 'active')
    insertBatch.run('batch-4', 'pond-4', '4号塘-鲈鱼2024春', '鲈鱼', '2024-04-10', null, 'active')
    insertBatch.run('batch-5', 'pond-1', '1号塘-草鱼2023秋', '草鱼', '2023-09-01', '2024-01-15', 'harvested')
    insertBatch.run('batch-6', 'pond-2', '2号塘-鲤鱼2023秋', '鲤鱼', '2023-09-10', '2024-01-20', 'harvested')

    insertAerator.run('aerator-1', 'pond-1', 'running', hoursAgo(2), 1)
    insertAerator.run('aerator-2', 'pond-2', 'stopped', hoursAgo(8), 1)
    insertAerator.run('aerator-3', 'pond-3', 'running', hoursAgo(1), 1)
    insertAerator.run('aerator-4', 'pond-4', 'fault', hoursAgo(6), 0)

    insertAlert.run('alert-1', 'threshold', 'critical', 'dissolved_oxygen', 'pond-1', 4.2, 5.0, hoursAgo(3), 'pending', null, null, null, null)
    insertAlert.run('alert-2', 'threshold', 'warning', 'temperature', 'pond-1', 31.5, 30.0, hoursAgo(5), 'acknowledged', '张技术员', hoursAgo(4), 'real_anomaly', '午后高温导致水温超标，已开启增氧机降温')
    insertAlert.run('alert-3', 'offline', 'critical', 'ph', 'pond-1', 0, 0, hoursAgo(2), 'pending', null, null, null, null)
    insertAlert.run('alert-4', 'offline', 'warning', 'dissolved_oxygen', 'pond-3', 0, 0, hoursAgo(4), 'acknowledged', '李技术员', hoursAgo(3), 'needs_onsite', '3号塘溶氧传感器疑似故障，需现场检查')
    insertAlert.run('alert-5', 'threshold', 'warning', 'ph', 'pond-3', 8.9, 8.5, hoursAgo(1), 'pending', null, null, null, null)
    insertAlert.run('alert-6', 'threshold', 'critical', 'dissolved_oxygen', 'pond-2', 4.8, 5.0, hoursAgo(0.5), 'pending', null, null, null, null)

    insertFeeding.run('feed-1', 'pond-1', 'batch-1', 25, '颗粒料', hoursAgo(20), 0, null)
    insertFeeding.run('feed-2', 'pond-1', 'batch-1', 30, '颗粒料', hoursAgo(16), 0, null)
    insertFeeding.run('feed-3', 'pond-1', 'batch-1', 20, '粉料', hoursAgo(12), 1, '因溶氧偏低，改用粉料减少耗氧，投喂量减少33%')
    insertFeeding.run('feed-4', 'pond-1', 'batch-1', 28, '颗粒料', hoursAgo(8), 1, '溶氧恢复，恢复颗粒料，投喂量恢复至28kg')
    insertFeeding.run('feed-5', 'pond-2', 'batch-2', 22, '颗粒料', hoursAgo(18), 0, null)
    insertFeeding.run('feed-6', 'pond-2', 'batch-2', 22, '颗粒料', hoursAgo(6), 0, null)
    insertFeeding.run('feed-7', 'pond-3', 'batch-3', 18, '颗粒料', hoursAgo(14), 0, null)
    insertFeeding.run('feed-8', 'pond-4', 'batch-4', 35, '膨化料', hoursAgo(10), 0, null)

    insertNote.run('note-1', 'alert-2', null, '午后高温导致水温超标，已开启增氧机降温', '张技术员', hoursAgo(4))
    insertNote.run('note-2', 'alert-4', null, '3号塘溶氧传感器疑似故障，需现场检查', '李技术员', hoursAgo(3))
    insertNote.run('note-3', 'alert-2', null, '增氧机开启2小时后水温已恢复至29.2°C', '张技术员', hoursAgo(2))

    insertUser.run('user-1', 'zhangsan', hashPassword('123456'), '张技术员', 'technician', 'pond-1,pond-2', isoNow())
    insertUser.run('user-2', 'lisi', hashPassword('123456'), '李技术员', 'technician', 'pond-3,pond-4', isoNow())
    insertUser.run('user-3', 'wangcz', hashPassword('123456'), '王场长', 'manager', null, isoNow())
    insertUser.run('user-4', 'admin', hashPassword('admin123'), '系统管理员', 'admin', null, isoNow())
  })

  seedTx()
  console.log('Database seeded successfully.')
}
