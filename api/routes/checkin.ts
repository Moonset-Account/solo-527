import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { studentId, requestId, method, dateStart, dateEnd } = req.query

  let results = store.checkInRecords.getAll()

  if (studentId) {
    results = results.filter(c => c.studentId === studentId)
  }
  if (requestId) {
    results = results.filter(c => c.requestId === requestId)
  }
  if (method) {
    results = results.filter(c => c.method === method)
  }
  if (dateStart) {
    results = results.filter(c => c.checkInTime >= (dateStart as string))
  }
  if (dateEnd) {
    results = results.filter(c => c.checkInTime <= (dateEnd as string))
  }

  results.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())

  res.json({ success: true, data: results })
})

router.post('/', (req: Request, res: Response): void => {
  const { studentId, studentName, requestId, location, method } = req.body

  if (!studentId || !method) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const student = store.students.getById(studentId)
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' })
    return
  }

  const record = store.checkInRecords.create({
    studentId,
    studentName: studentName || student.name,
    requestId: requestId || '',
    checkInTime: new Date().toISOString(),
    location: location || `${student.building}${student.roomNumber}`,
    method,
  })

  res.status(201).json({ success: true, data: record })
})

router.get('/stats', (_req: Request, res: Response): void => {
  const allRecords = store.checkInRecords.getAll()

  const total = allRecords.length
  const qrcodeCount = allRecords.filter(c => c.method === 'qrcode').length
  const manualCount = allRecords.filter(c => c.method === 'manual').length

  const locationMap: Record<string, number> = {}
  for (const r of allRecords) {
    locationMap[r.location] = (locationMap[r.location] || 0) + 1
  }

  const today = new Date().toISOString().split('T')[0]
  const todayCount = allRecords.filter(c => c.checkInTime.startsWith(today)).length

  const buildingMap: Record<string, number> = {}
  for (const r of allRecords) {
    const building = r.location.replace(/[\d]+室.*/, '')
    buildingMap[building] = (buildingMap[building] || 0) + 1
  }

  res.json({
    success: true,
    data: {
      total,
      todayCount,
      methodBreakdown: { qrcode: qrcodeCount, manual: manualCount },
      locationBreakdown: locationMap,
      buildingBreakdown: buildingMap,
    },
  })
})

export default router
