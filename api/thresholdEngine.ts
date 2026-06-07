import { getDb } from './database'

function uuid(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export function checkThresholds(pondId: string, metric: string, value: number): void {
  const db = getDb()

  const threshold = db.prepare(
    'SELECT * FROM thresholds WHERE pond_id = ? AND metric = ?'
  ).get(pondId, metric) as any

  if (!threshold) return

  let severity: string | null = null
  let triggered = false

  if (value <= threshold.critical_low || value >= threshold.critical_high) {
    severity = 'critical'
    triggered = true
  } else if (value <= threshold.warning_low || value >= threshold.warning_high) {
    severity = 'warning'
    triggered = true
  }

  if (triggered && severity) {
    const recentAlert = db.prepare(
      "SELECT id FROM alerts WHERE pond_id = ? AND metric = ? AND type = 'threshold' AND status = 'pending' ORDER BY triggered_at DESC LIMIT 1"
    ).get(pondId, metric) as any

    if (recentAlert) return

    db.prepare(`
      INSERT INTO alerts (id, type, severity, metric, pond_id, value, threshold_value, triggered_at, status)
      VALUES (?, 'threshold', ?, ?, ?, ?, ?, datetime('now'), 'pending')
    `).run(uuid(), severity, metric, pondId, value, value <= threshold.warning_low ? threshold.warning_low : threshold.warning_high)
  }
}

export function checkOfflineStatus(sensorId: string, pondId: string, metric: string): void {
  const db = getDb()

  const recentAlert = db.prepare(
    "SELECT id FROM alerts WHERE pond_id = ? AND metric = ? AND type = 'offline' AND status = 'pending' ORDER BY triggered_at DESC LIMIT 1"
  ).get(pondId, metric) as any

  if (recentAlert) return

  db.prepare(`
    INSERT INTO alerts (id, type, severity, metric, pond_id, value, threshold_value, triggered_at, status)
    VALUES (?, 'offline', 'critical', ?, ?, 0, 0, datetime('now'), 'pending')
  `).run(uuid(), metric, pondId)
}
