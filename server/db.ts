import type { ClickHouseDB, BinPointRow, CommunityRow, MisuseRecordRow, CollectionLogRow, InspectionPhotoRow, AuditLogRow, ReturnVisitRow, HolidayScheduleRow, FullAlertRow } from './types.js'

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

function encodeGeoHash(lng: number, lat: number, precision: number = 8): string {
  let latRange: [number, number] = [-90, 90]
  let lngRange: [number, number] = [-180, 180]
  let hash = ''
  let bits = 0
  let bitCount = 0
  let isLng = true
  while (hash.length < precision) {
    const mid = isLng ? (lngRange[0] + lngRange[1]) / 2 : (latRange[0] + latRange[1]) / 2
    if (isLng ? lng >= mid : lat >= mid) {
      bits = bits * 2 + 1
      if (isLng) lngRange[0] = mid; else latRange[0] = mid
    } else {
      bits = bits * 2
      if (isLng) lngRange[1] = mid; else latRange[1] = mid
    }
    isLng = !isLng
    bitCount++
    if (bitCount === 5) { hash += BASE32[bits]; bits = 0; bitCount = 0 }
  }
  return hash
}

function randomRange(min: number, max: number) { return Math.random() * (max - min) + min }
function randomInt(min: number, max: number) { return Math.floor(randomRange(min, max + 1)) }
function randomChoice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function formatDate(d: Date) { return d.toISOString().split('T')[0] }
function formatDateTime(d: Date) { return d.toISOString() }

const districts = ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区']
const communityNames = [
  '阳光花园', '绿城小区', '幸福家园', '和平里社区', '望京花园',
  '中关村社区', '亚运村小区', '三里屯社区', '国贸花园', '金融街社区',
  '世纪城小区', '万柳社区', '学院路小区', '花园路社区', '西二旗小区'
]
const binPointNames = [
  '1号投放点', '2号投放点', '3号投放点', '4号投放点', '5号投放点',
  '东门投放点', '西门投放点', '南门投放点', '北门投放点', '中心广场',
  '活动中心', '物业服务中心', '幼儿园旁', '小学门口', '健身区旁'
]
const gridCodes = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3']

function generateCommunities(): CommunityRow[] {
  return communityNames.map((name, i) => ({
    id: `comm-${String(i + 1).padStart(3, '0')}`, name, district: districts[i % districts.length], household_count: randomInt(500, 3000)
  }))
}

function generateBinPoints(communities: CommunityRow[]): BinPointRow[] {
  const points: BinPointRow[] = []
  let id = 1
  const baseLng = 116.4074; const baseLat = 39.9042
  const districtCenters: Record<string, { lng: number; lat: number }> = {}
  districts.forEach((d, i) => {
    const angle = (i / districts.length) * Math.PI * 2
    districtCenters[d] = { lng: baseLng + Math.cos(angle) * 0.06, lat: baseLat + Math.sin(angle) * 0.04 }
  })
  communities.forEach((comm, ci) => {
    const center = districtCenters[comm.district]
    const commLng = center.lng + (ci % 3 - 1) * 0.008 + randomRange(-0.003, 0.003)
    const commLat = center.lat + (Math.floor(ci / 3) % 3 - 1) * 0.006 + randomRange(-0.003, 0.003)
    const count = randomInt(3, 8)
    for (let i = 0; i < count; i++) {
      const statuses: string[] = ['normal', 'normal', 'normal', 'warning', 'full', 'abnormal']
      const status = randomChoice(statuses)
      const lng = commLng + randomRange(-0.004, 0.004)
      const lat = commLat + randomRange(-0.003, 0.003)
      points.push({
        id: `bin-${String(id).padStart(5, '0')}`, community_id: comm.id, name: randomChoice(binPointNames),
        lng, lat, geo_hash: encodeGeoHash(lng, lat, 8), status, bin_count: randomInt(2, 6),
        grid_code: randomChoice(gridCodes),
        fill_level: status === 'full' ? randomInt(90, 100) : status === 'warning' ? randomInt(70, 89) : randomInt(20, 69),
        last_update: formatDateTime(new Date(Date.now() - randomInt(0, 3600000)))
      })
      id++
    }
  })
  return points
}

function generateMisuseRecords(binPoints: BinPointRow[]): MisuseRecordRow[] {
  const records: MisuseRecordRow[] = []
  const types = ['recyclable', 'hazardous', 'kitchen', 'other']
  const auditStatuses = ['pending', 'approved', 'approved', 'approved', 'rejected']
  let id = 1; const today = new Date()
  binPoints.forEach(bin => {
    for (let day = 0; day < 30; day++) {
      if (Math.random() > 0.4) continue
      const date = new Date(today); date.setDate(date.getDate() - day)
      types.forEach(type => {
        if (Math.random() > 0.5) return
        const auditStatus = randomChoice(auditStatuses)
        records.push({
          id: `misuse-${String(id).padStart(6, '0')}`, bin_point_id: bin.id,
          record_date: formatDate(date), misuse_type: type,
          misuse_rate: parseFloat(randomRange(2, 25).toFixed(1)), audit_status: auditStatus,
          auditor: auditStatus !== 'pending' ? '审核员' + randomInt(1, 5) : null,
          audit_time: auditStatus !== 'pending' ? formatDateTime(date) : null
        })
        id++
      })
    }
  })
  return records
}

function generateFullAlerts(binPoints: BinPointRow[]): FullAlertRow[] {
  const alerts: FullAlertRow[] = []
  const levels = ['low', 'medium', 'high']
  const statuses = ['pending', 'processing', 'resolved', 'resolved', 'resolved']
  let id = 1; const today = new Date()
  binPoints.filter(b => b.status === 'full' || b.status === 'warning').forEach(bin => {
    const count = randomInt(1, 5)
    for (let i = 0; i < count; i++) {
      const alertTime = new Date(today.getTime() - randomInt(0, 7 * 86400000))
      const status = randomChoice(statuses)
      const handleTime = status !== 'pending' ? new Date(alertTime.getTime() + randomInt(30, 180) * 60000) : null
      alerts.push({
        id: `alert-${String(id).padStart(6, '0')}`, bin_point_id: bin.id,
        alert_time: formatDateTime(alertTime), handle_time: handleTime ? formatDateTime(handleTime) : null,
        level: randomChoice(levels), status, handler: status !== 'pending' ? '清运员' + randomInt(1, 10) : null
      })
      id++
    }
  })
  return alerts
}

function generateCollectionLogs(binPoints: BinPointRow[], holidays: HolidayScheduleRow[]): CollectionLogRow[] {
  const logs: CollectionLogRow[] = []
  const timeWindows = ['早班 06:00-08:00', '中班 12:00-14:00', '晚班 18:00-20:00']
  const statuses: string[] = ['completed', 'completed', 'completed', 'completed', 'delayed']
  let id = 1; const today = new Date()
  const holidaySet = new Set(holidays.filter(h => !h.is_workday).map(h => h.date))
  binPoints.forEach(bin => {
    for (let day = 0; day < 30; day++) {
      const date = new Date(today); date.setDate(date.getDate() - day)
      const dateStr = formatDate(date)
      const isHoliday = holidaySet.has(dateStr) ? 1 : 0
      if (isHoliday && Math.random() > 0.3) continue
      timeWindows.forEach(window => {
        if (Math.random() > 0.7) return
        const planHour = parseInt(window.split(' ')[1].split(':')[0])
        const planTime = new Date(date); planTime.setHours(planHour, randomInt(0, 30), 0, 0)
        const status = randomChoice(statuses)
        const delay = status === 'delayed' ? randomInt(30, 120) : randomInt(-10, 20)
        const actualTime = new Date(planTime.getTime() + delay * 60000)
        logs.push({
          id: `collect-${String(id).padStart(6, '0')}`, bin_point_id: bin.id,
          plan_time: formatDateTime(planTime), actual_time: formatDateTime(actualTime),
          time_window: window, is_holiday: isHoliday, status,
          vehicle_no: '京A' + String(randomInt(10000, 99999))
        })
        id++
      })
    }
  })
  return logs
}

function generateInspectionPhotos(binPoints: BinPointRow[]): InspectionPhotoRow[] {
  const photos: InspectionPhotoRow[] = []
  const uploaders = ['巡查员1', '巡查员2', '巡查员3', '巡查员4', '巡查员5']
  const auditStatuses: string[] = ['pending', 'pending', 'approved', 'approved', 'rejected']
  let id = 1; const today = new Date()
  binPoints.forEach(bin => {
    const count = randomInt(3, 15)
    for (let i = 0; i < count; i++) {
      const uploadTime = new Date(today.getTime() - randomInt(0, 30 * 86400000))
      const auditStatus = randomChoice(auditStatuses)
      photos.push({
        id: `photo-${String(id).padStart(6, '0')}`, bin_point_id: bin.id,
        uploader: randomChoice(uploaders), upload_time: formatDateTime(uploadTime),
        photo_url: `https://picsum.photos/seed/photo${id}/400/300`, audit_status: auditStatus,
        audit_log_id: null
      })
      id++
    }
  })
  return photos
}

function generateAuditLogs(photos: InspectionPhotoRow[]): AuditLogRow[] {
  const logs: AuditLogRow[] = []
  const auditors = ['审核员1', '审核员2', '审核员3']
  const rejectReasons = ['照片模糊，无法识别', '拍摄角度不正确', '未拍摄到完整桶点', '照片与桶点不匹配', '光线过暗，无法判断']
  let id = 1
  photos.filter(p => p.audit_status !== 'pending').forEach(photo => {
    const auditTime = new Date(new Date(photo.upload_time).getTime() + randomInt(30, 360) * 60000)
    logs.push({
      id: `audit-${String(id).padStart(6, '0')}`, photo_id: photo.id,
      auditor: randomChoice(auditors), audit_time: formatDateTime(auditTime),
      result: photo.audit_status === 'approved' ? 'approved' : 'rejected',
      reject_reason: photo.audit_status === 'rejected' ? randomChoice(rejectReasons) : null
    })
    id++
  })
  return logs
}

function generateReturnVisits(binPoints: BinPointRow[]): ReturnVisitRow[] {
  const visits: ReturnVisitRow[] = []
  const issueTypes = ['误投严重', '满溢未清', '设施损坏', '标识不清', '周边脏乱']
  let id = 1; const today = new Date()
  binPoints.filter(b => b.status === 'full' || b.status === 'abnormal').forEach(bin => {
    const count = randomInt(0, 3)
    for (let i = 0; i < count; i++) {
      const visitTime = new Date(today.getTime() - randomInt(0, 14 * 86400000))
      visits.push({
        id: `visit-${String(id).padStart(6, '0')}`, bin_point_id: bin.id,
        visit_time: formatDateTime(visitTime), visitor: '巡查员' + randomInt(1, 5),
        issue_type: randomChoice(issueTypes), rectification: '已通知物业整改',
        status: Math.random() > 0.4 ? 'completed' : 'pending'
      })
      id++
    }
  })
  return visits
}

function generateHolidays(): HolidayScheduleRow[] {
  const holidays: HolidayScheduleRow[] = []
  const year = new Date().getFullYear()
  const holidayNames = [
    { name: '元旦', month: 1, day: 1 }, { name: '春节', month: 2, day: 10 },
    { name: '清明节', month: 4, day: 4 }, { name: '劳动节', month: 5, day: 1 },
    { name: '端午节', month: 6, day: 10 }, { name: '中秋节', month: 9, day: 17 },
    { name: '国庆节', month: 10, day: 1 }
  ]
  holidayNames.forEach(h => {
    const date = new Date(year, h.month - 1, h.day)
    for (let i = 0; i < 3; i++) {
      const d = new Date(date); d.setDate(d.getDate() + i)
      holidays.push({ date: formatDate(d), name: h.name, is_workday: 0 })
    }
  })
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= 28; d++) {
      const date = new Date(year, m, d); const day = date.getDay()
      if (day === 0 || day === 6) {
        const dateStr = formatDate(date)
        if (!holidays.find(h => h.date === dateStr)) {
          holidays.push({ date: dateStr, name: day === 0 ? '周日' : '周六', is_workday: 0 })
        }
      }
    }
  }
  return holidays
}

export async function initDatabase(): Promise<ClickHouseDB> {
  console.log('[ClickHouse] Initializing simulated database...')
  const communities = generateCommunities()
  const binPoints = generateBinPoints(communities)
  const holidays = generateHolidays()
  const misuseRecords = generateMisuseRecords(binPoints)
  const fullAlerts = generateFullAlerts(binPoints)
  const collectionLogs = generateCollectionLogs(binPoints, holidays)
  const inspectionPhotos = generateInspectionPhotos(binPoints)
  const auditLogs = generateAuditLogs(inspectionPhotos)
  const returnVisits = generateReturnVisits(binPoints)
  console.log(`[ClickHouse] Data initialized: ${communities.length} communities, ${binPoints.length} bin points, ${misuseRecords.length} misuse records, ${collectionLogs.length} collection logs, ${inspectionPhotos.length} photos, ${auditLogs.length} audit logs`)
  return { communities, binPoints, misuseRecords, fullAlerts, collectionLogs, inspectionPhotos, auditLogs, returnVisits, holidays }
}
