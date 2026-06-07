import { Router } from 'express'
import { executeQuery, getFallbackDbSync } from '../clickhouse.js'
import { logQuery } from '../types.js'

export function holidayRoutes() {
  const router = Router()

  router.get('/', async (req, res) => {
    const t0 = Date.now()
    const year = req.query.year as string

    let sql = `SELECT date, name, is_workday FROM holiday_schedules ORDER BY date`
    const params: Record<string, any> = { year: year || 'all' }
    if (year) sql = `SELECT date, name, is_workday FROM holiday_schedules WHERE date >= {startDate:Date} AND date <= {endDate:Date} ORDER BY date`

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      let data = db.holidays
      if (year) data = data.filter(h => h.date.startsWith(year))
      return data
    })

    logQuery(sql, params, Date.now() - t0, result.data.length)
    res.json({ sql, params, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/non-workdays', async (req, res) => {
    const t0 = Date.now()
    const startDate = (req.query.startDate as string) || ''
    const endDate = (req.query.endDate as string) || ''

    let sql = `SELECT date, name FROM holiday_schedules WHERE is_workday = 0`
    const params: Record<string, any> = {}
    if (startDate) { sql += ` AND date >= {startDate:Date}`; params.startDate = startDate }
    if (endDate) { sql += ` AND date <= {endDate:Date}`; params.endDate = endDate }
    sql += ` ORDER BY date`

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      let data = db.holidays.filter(h => h.is_workday === 0)
      if (startDate) data = data.filter(h => h.date >= startDate)
      if (endDate) data = data.filter(h => h.date <= endDate)
      return data
    })

    logQuery(sql, params, Date.now() - t0, result.data.length)
    res.json({ sql, params, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/check', async (req, res) => {
    const t0 = Date.now()
    const date = req.query.date as string
    const sql = `SELECT is_workday, name FROM holiday_schedules WHERE date = {date:Date}`
    const params = { date }

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      const holiday = db.holidays.find(h => h.date === date)
      const data = holiday ? { date, isWorkday: !!holiday.is_workday, name: holiday.name, isHoliday: !holiday.is_workday } : { date, isWorkday: true, name: null, isHoliday: false }
      return [data]
    })

    logQuery(sql, params, Date.now() - t0, 1)
    res.json({ sql, params, data: result.data[0], fromClickHouse: result.fromClickHouse })
  })

  return router
}
