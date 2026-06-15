import { Router, type Request, type Response } from 'express'
import Appointment from '../models/Appointment.js'
import Closure from '../models/Closure.js'
import ExportRecord from '../models/ExportRecord.js'
import { cacheGet, cacheSet } from '../db/redis.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    row.map((cell) => {
      const str = String(cell ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(','),
  )
  return [headerLine, ...dataLines].join('\n')
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filterCriteria = {} } = req.body
    const startDate = filterCriteria.startDate || ''
    const endDate = filterCriteria.endDate || ''

    const dateFilter: Record<string, any> = {}
    if (startDate && endDate) {
      dateFilter.date = { $gte: startDate, $lte: endDate }
    }

    const [appointments, closures] = await Promise.all([
      Appointment.find(dateFilter)
        .populate('doctorId', 'name title')
        .populate('serviceId', 'name')
        .populate('timeSlotId', 'startTime endTime label')
        .sort({ date: 1 }),
      Closure.countDocuments(startDate && endDate ? { date: dateFilter.date } : {}),
    ])

    const arrivedCount = appointments.filter((a) => ['arrived', 'completed'].includes(a.status)).length
    const arrivalRate = appointments.length > 0 ? (arrivedCount / appointments.length) * 100 : 0

    const lastAppointment = appointments[appointments.length - 1]
    const lastChangeAt = lastAppointment?.updatedAt?.toISOString() || new Date().toISOString()

    const headers = ['日期', '患者姓名', '患者电话', '医生', '时段', '服务', '状态', '未到原因']
    const rows = appointments.map((apt: any) => [
      apt.date,
      apt.patientName,
      apt.patientPhone,
      apt.doctorId?.name || '',
      apt.timeSlotId?.label || '',
      apt.serviceId?.name || '',
      apt.status,
      apt.noShowReason || '',
    ])

    const csvData = buildCSV(headers, rows)

    const exportsDir = path.join(__dirname, '..', '..', 'uploads', 'exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const fileName = `export_${timestamp}.csv`
    const filePath = path.join(exportsDir, fileName)
    fs.writeFileSync(filePath, '\uFEFF' + csvData, 'utf-8')

    const fileUrl = `/uploads/exports/${fileName}`

    const operatorId = (req.headers['x-operator-id'] as string) || ''
    const operatorName = (req.headers['x-operator-name'] as string) || ''

    const record = await ExportRecord.create({
      operatorId,
      operatorName,
      filterCriteria,
      arrivalRate: Math.round(arrivalRate * 100) / 100,
      closureCount: closures,
      lastChangeAt,
      fileUrl,
    })

    res.status(201).json({ success: true, data: record })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await ExportRecord.find().sort({ createdAt: -1 })
    res.json({ success: true, data: records })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await ExportRecord.findById(req.params.id)
    if (!record) {
      res.status(404).json({ success: false, error: 'Export record not found' })
      return
    }

    const filePath = path.join(__dirname, '..', '..', record.fileUrl)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Export file not found' })
      return
    }

    res.download(filePath, `export_${record._id}.csv`)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
