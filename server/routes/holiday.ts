import { Router } from 'express'
import type { ClickHouseDB } from '../types.js'
import { logQuery } from '../types.js'

export function holidayRoutes(db: ClickHouseDB) {
  const router = Router()

  router.get('/', (req, res) => {
    const t0 = Date.now()
    const year = req.query.year as string
    const sql = `SELECT date, name, is_workday FROM holiday_schedules ORDER BY date`
    let data = db.holidays
    if (year) data = data.filter(h => h.date.startsWith(year))
    logQuery(sql, { year: year || 'all' }, Date.now() - t0, data.length)
    res.json({ sql, params: { year: year || 'all' }, data, rowCount: data.length })
  })

  router.get('/non-workdays', (req, res) => {
    const t0 = Date.now()
    const startDate = (req.query.startDate as string) || ''
    const endDate = (req.query.endDate as string) || ''

    let sql = `SELECT date, name FROM holiday_schedules WHERE is_workday = 0`
    const params: Record<string, any> = {}
    if (startDate) { sql += ` AND date >= {startDate:Date}`; params.startDate = startDate }
    if (endDate) { sql += ` AND date <= {endDate:Date}`; params.endDate = endDate }
    sql += ` ORDER BY date`

    let data = db.holidays.filter(h => h.is_workday === 0)
    if (startDate) data = data.filter(h => h.date >= startDate)
    if (endDate) data = data.filter(h => h.date <= endDate)

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  router.get('/check', (req, res) => {
    const t0 = Date.now()
    const date = req.query.date as string
    const sql = `SELECT is_workday, name FROM holiday_schedules WHERE date = {date:Date}`
    const params = { date }
    const holiday = db.holidays.find(h => h.date === date)
    const data = holiday ? { date, isWorkday: !!holiday.is_workday, name: holiday.name, isHoliday: !holiday.is_workday } : { date, isWorkday: true, name: null, isHoliday: false }
    logQuery(sql, params, Date.now() - t0, 1)
    res.json({ sql, params, data })
  })

  return router
}
