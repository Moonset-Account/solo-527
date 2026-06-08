import nodeCron, { type ScheduledTask } from 'node-cron'
import { getDb } from './db.js'
import { clearCache } from './cache.js'
import type { FilterState } from './types.ts'

interface SchedulerStatus {
  running: boolean
  lastRun: string | null
  nextRun: string | null
  taskCount: number
}

let schedulerActive = false
let lastRunTime: string | null = null
let scheduledTask: ScheduledTask | null = null

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return parseFloat((((curr - prev) / prev) * 100).toFixed(1))
}

function generateAutoReport(): void {
  try {
    const db = getDb()

    const dataRange = db.prepare(
      `SELECT MIN(borrow_date) as minDate, MAX(borrow_date) as maxDate FROM borrow_record`
    ).get() as { minDate: string; maxDate: string }

    if (!dataRange.minDate || !dataRange.maxDate) {
      console.log('[Scheduler] No borrow data available, skipping auto report')
      return
    }

    const filter: FilterState = {
      collectionTypes: [],
      readerGroups: [],
      themes: [],
      branches: [],
      dateRange: { start: dataRange.minDate, end: dataRange.maxDate },
    }

    const filterJson = JSON.stringify(filter)
    const existing = db.prepare(
      `SELECT report_id FROM weekly_report WHERE report_id LIKE 'WR-AUTO-%' AND filter_snapshot = ? LIMIT 1`
    ).get(filterJson)

    if (existing) {
      console.log(`[Scheduler] Auto report with same data scope already exists (${(existing as { report_id: string }).report_id}), skipping`)
      return
    }

    const baseJoin = `borrow_record br JOIN reader r ON br.reader_id = r.reader_id JOIN book b ON br.book_id = b.book_id`

    const currentStats = db.prepare(
      `SELECT COUNT(*) as totalBorrows,
        SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewals,
        SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdues
      FROM ${baseJoin} WHERE br.borrow_date >= ? AND br.borrow_date <= ?`
    ).get(filter.dateRange.start, filter.dateRange.end) as { totalBorrows: number; renewals: number; overdues: number }

    const startDate = new Date(filter.dateRange.start)
    const endDate = new Date(filter.dateRange.end)
    const diffMs = endDate.getTime() - startDate.getTime()

    const momEnd = new Date(startDate)
    momEnd.setDate(momEnd.getDate() - 1)
    const momStart = new Date(momEnd.getTime() - diffMs)
    const prevStats = db.prepare(
      `SELECT COUNT(*) as totalBorrows,
        SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewals,
        SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdues
      FROM ${baseJoin} WHERE br.borrow_date >= ? AND br.borrow_date <= ?`
    ).get(momStart.toISOString().slice(0, 10), momEnd.toISOString().slice(0, 10)) as { totalBorrows: number; renewals: number; overdues: number }

    const yoyStart = new Date(startDate)
    yoyStart.setFullYear(yoyStart.getFullYear() - 1)
    const yoyEnd = new Date(yoyStart.getTime() + diffMs)
    const yoyStats = db.prepare(
      `SELECT COUNT(*) as totalBorrows,
        SUM(CASE WHEN br.is_renewed = 1 THEN 1 ELSE 0 END) as renewals,
        SUM(CASE WHEN br.is_overdue = 1 THEN 1 ELSE 0 END) as overdues
      FROM ${baseJoin} WHERE br.borrow_date >= ? AND br.borrow_date <= ?`
    ).get(yoyStart.toISOString().slice(0, 10), yoyEnd.toISOString().slice(0, 10)) as { totalBorrows: number; renewals: number; overdues: number }

    const resBaseJoin = `reservation rv JOIN reader r ON rv.reader_id = r.reader_id JOIN book b ON rv.book_id = b.book_id`

    function queryResRate(dateStart: string, dateEnd: string): number {
      const stats = db.prepare(
        `SELECT COUNT(*) as total, SUM(CASE WHEN rv.status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled FROM ${resBaseJoin} WHERE rv.reserve_date >= ? AND rv.reserve_date <= ?`
      ).get(dateStart, dateEnd) as { total: number; fulfilled: number }
      return stats.total > 0 ? parseFloat(((stats.fulfilled / stats.total) * 100).toFixed(1)) : 0
    }

    const fulfillRate = queryResRate(filter.dateRange.start, filter.dateRange.end)
    const prevFulfillRate = queryResRate(momStart.toISOString().slice(0, 10), momEnd.toISOString().slice(0, 10))
    const yoyFulfillRate = queryResRate(yoyStart.toISOString().slice(0, 10), yoyEnd.toISOString().slice(0, 10))

    const overdueRate = currentStats.totalBorrows > 0 ? parseFloat(((currentStats.overdues / currentStats.totalBorrows) * 100).toFixed(1)) : 0
    const renewalRate = currentStats.totalBorrows > 0 ? parseFloat(((currentStats.renewals / currentStats.totalBorrows) * 100).toFixed(1)) : 0
    const prevOverdueRate = prevStats.totalBorrows > 0 ? parseFloat(((prevStats.overdues / prevStats.totalBorrows) * 100).toFixed(1)) : 0
    const prevRenewalRate = prevStats.totalBorrows > 0 ? parseFloat(((prevStats.renewals / prevStats.totalBorrows) * 100).toFixed(1)) : 0

    const keyChanges: string[] = []
    const anomalies: { type: string; description: string; severity: 'high' | 'medium' | 'low' }[] = []

    const borrowChange = pctChange(currentStats.totalBorrows, prevStats.totalBorrows)
    if (borrowChange !== 0) keyChanges.push(`借阅量环比${borrowChange > 0 ? '增长' : '下降'}${Math.abs(borrowChange)}%`)

    const borrowYoy = pctChange(currentStats.totalBorrows, yoyStats.totalBorrows)
    if (borrowYoy !== 0) keyChanges.push(`借阅量同比${borrowYoy > 0 ? '增长' : '下降'}${Math.abs(borrowYoy)}%`)

    if (overdueRate > 15) keyChanges.push(`逾期率${overdueRate}%，超过阈值`)
    if (fulfillRate < 70) keyChanges.push(`预约满足率${fulfillRate}%，低于70%`)

    if (Math.abs(borrowChange) > 20) anomalies.push({ type: 'borrow_spike', description: `借阅量环比变化幅度异常: ${borrowChange > 0 ? '+' : ''}${borrowChange}%`, severity: Math.abs(borrowChange) > 40 ? 'high' : 'medium' })
    const overdueChange = pctChange(currentStats.overdues ?? 0, prevStats.overdues ?? 0)
    if (overdueChange > 10) anomalies.push({ type: 'overdue_increase', description: `逾期量环比增长${overdueChange}%`, severity: overdueChange > 30 ? 'high' : 'medium' })
    if (overdueRate > 15) anomalies.push({ type: 'overdue_high', description: `逾期率${overdueRate}%超过阈值15%`, severity: overdueRate > 25 ? 'high' : 'medium' })
    if (renewalRate < 20) anomalies.push({ type: 'renewal_low', description: `续借率${renewalRate}%偏低`, severity: 'low' })
    if (fulfillRate < 70 && fulfillRate > 0) anomalies.push({ type: 'fulfill_low', description: `预约满足率${fulfillRate}%低于70%`, severity: fulfillRate < 50 ? 'high' : 'medium' })

    if (keyChanges.length === 0) keyChanges.push('当前筛选范围内数据无明显变化')
    if (anomalies.length === 0) anomalies.push({ type: 'none', description: '未检测到异常', severity: 'low' })

    const yoyComparison = [
      { metric: '借阅量', current: currentStats.totalBorrows, previous: yoyStats.totalBorrows, change: borrowYoy },
      { metric: '续借数', current: currentStats.renewals ?? 0, previous: yoyStats.renewals ?? 0, change: pctChange(currentStats.renewals ?? 0, yoyStats.renewals ?? 0) },
      { metric: '逾期数', current: currentStats.overdues ?? 0, previous: yoyStats.overdues ?? 0, change: pctChange(currentStats.overdues ?? 0, yoyStats.overdues ?? 0) },
      { metric: '预约满足率(%)', current: fulfillRate, previous: yoyFulfillRate, change: pctChange(fulfillRate, yoyFulfillRate) },
    ]

    const momComparison = [
      { metric: '借阅量', current: currentStats.totalBorrows, previous: prevStats.totalBorrows, change: borrowChange },
      { metric: '续借率(%)', current: renewalRate, previous: prevRenewalRate, change: pctChange(renewalRate, prevRenewalRate) },
      { metric: '逾期率(%)', current: overdueRate, previous: prevOverdueRate, change: pctChange(overdueRate, prevOverdueRate) },
      { metric: '预约满足率(%)', current: fulfillRate, previous: prevFulfillRate, change: pctChange(fulfillRate, prevFulfillRate) },
    ]

    const reportId = `WR-AUTO-${Date.now()}`
    const filterSnapshot = { ...filter }

    db.prepare(
      `INSERT INTO weekly_report (report_id, week_start, week_end, key_changes, yoy_comparison, mom_comparison, anomalies, filter_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      reportId,
      filter.dateRange.start,
      filter.dateRange.end,
      JSON.stringify(keyChanges),
      JSON.stringify(yoyComparison),
      JSON.stringify(momComparison),
      JSON.stringify(anomalies),
      filterJson,
    )

    clearCache()
    lastRunTime = new Date().toISOString()
    console.log(`[Scheduler] Auto report generated: ${reportId} (${filter.dateRange.start} ~ ${filter.dateRange.end})`)
  } catch (err) {
    console.error('[Scheduler] Auto report generation failed:', err)
  }
}

export function startScheduler(): void {
  if (schedulerActive) return

  scheduledTask = nodeCron.schedule('0 2 * * 1', () => {
    console.log('[Scheduler] Running scheduled weekly report generation...')
    generateAutoReport()
  }, {
    timezone: 'Asia/Shanghai',
    name: 'weekly-auto-report',
  })

  schedulerActive = true
  console.log('[Scheduler] Weekly auto-report cron started (every Monday 02:00 CST)')

  generateAutoReport()
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop()
    scheduledTask.destroy()
    scheduledTask = null
  }
  schedulerActive = false
  console.log('[Scheduler] Stopped')
}

export function getSchedulerStatus(): SchedulerStatus {
  return {
    running: schedulerActive,
    lastRun: lastRunTime,
    nextRun: schedulerActive ? 'Next Monday 02:00 CST' : null,
    taskCount: schedulerActive ? 1 : 0,
  }
}
