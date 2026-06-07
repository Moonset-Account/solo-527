import type {
  Community,
  BinPoint,
  MisuseRecord,
  FullAlert,
  CollectionLog,
  InspectionPhoto,
  AuditLog,
  ReturnVisit,
  HolidaySchedule,
  User,
  GeoJson
} from '@/types'

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1))
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateTime(date: Date): string {
  return date.toISOString()
}

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

export function generateCommunities(): Community[] {
  return communityNames.map((name, index) => ({
    id: `comm-${String(index + 1).padStart(3, '0')}`,
    name,
    district: randomChoice(districts),
    householdCount: randomInt(500, 3000)
  }))
}

export function generateBinPoints(communities: Community[]): BinPoint[] {
  const binPoints: BinPoint[] = []
  let id = 1

  const baseLng = 116.4074
  const baseLat = 39.9042

  communities.forEach((comm, commIndex) => {
    const commLng = baseLng + (commIndex % 5 - 2) * 0.08 + randomRange(-0.02, 0.02)
    const commLat = baseLat + (Math.floor(commIndex / 5) - 1) * 0.06 + randomRange(-0.02, 0.02)

    const count = randomInt(3, 8)
    for (let i = 0; i < count; i++) {
      const statuses: BinPoint['status'][] = ['normal', 'normal', 'normal', 'warning', 'full', 'abnormal']
      const status = randomChoice(statuses)

      binPoints.push({
        id: `bin-${String(id).padStart(5, '0')}`,
        communityId: comm.id,
        name: randomChoice(binPointNames),
        lng: commLng + randomRange(-0.015, 0.015),
        lat: commLat + randomRange(-0.01, 0.01),
        status,
        binCount: randomInt(2, 6),
        gridCode: randomChoice(gridCodes),
        fillLevel: status === 'full' ? randomInt(90, 100) : status === 'warning' ? randomInt(70, 89) : randomInt(20, 69),
        lastUpdate: formatDateTime(new Date(Date.now() - randomInt(0, 3600000)))
      })
      id++
    }
  })

  return binPoints
}

export function generateMisuseRecords(binPoints: BinPoint[]): MisuseRecord[] {
  const records: MisuseRecord[] = []
  const types: MisuseRecord['misuseType'][] = ['recyclable', 'hazardous', 'kitchen', 'other']
  const auditStatuses: MisuseRecord['auditStatus'][] = ['pending', 'approved', 'approved', 'approved', 'rejected']

  let id = 1
  const today = new Date()

  binPoints.forEach(bin => {
    for (let day = 0; day < 30; day++) {
      if (Math.random() > 0.4) continue

      const date = new Date(today)
      date.setDate(date.getDate() - day)

      types.forEach(type => {
        if (Math.random() > 0.5) return

        const auditStatus = randomChoice(auditStatuses)
        records.push({
          id: `misuse-${String(id).padStart(6, '0')}`,
          binPointId: bin.id,
          recordDate: formatDate(date),
          misuseType: type,
          misuseRate: parseFloat(randomRange(2, 25).toFixed(1)),
          auditStatus,
          auditor: auditStatus !== 'pending' ? '审核员' + randomInt(1, 5) : undefined,
          auditTime: auditStatus !== 'pending' ? formatDateTime(date) : undefined
        })
        id++
      })
    }
  })

  return records
}

export function generateFullAlerts(binPoints: BinPoint[]): FullAlert[] {
  const alerts: FullAlert[] = []
  const levels: FullAlert['level'][] = ['low', 'medium', 'high']
  const statuses: FullAlert['status'][] = ['pending', 'processing', 'resolved', 'resolved', 'resolved']

  let id = 1
  const today = new Date()

  binPoints.filter(b => b.status === 'full' || b.status === 'warning').forEach(bin => {
    const count = randomInt(1, 5)
    for (let i = 0; i < count; i++) {
      const alertTime = new Date(today.getTime() - randomInt(0, 7 * 86400000))
      const status = randomChoice(statuses)
      const handleTime = status !== 'pending' ? new Date(alertTime.getTime() + randomInt(30, 180) * 60000) : undefined

      alerts.push({
        id: `alert-${String(id).padStart(6, '0')}`,
        binPointId: bin.id,
        alertTime: formatDateTime(alertTime),
        handleTime: handleTime ? formatDateTime(handleTime) : undefined,
        level: randomChoice(levels),
        status,
        handler: status !== 'pending' ? '清运员' + randomInt(1, 10) : undefined
      })
      id++
    }
  })

  return alerts
}

export function generateCollectionLogs(binPoints: BinPoint[], holidays: HolidaySchedule[]): CollectionLog[] {
  const logs: CollectionLog[] = []
  const timeWindows = ['早班 06:00-08:00', '中班 12:00-14:00', '晚班 18:00-20:00']
  const statuses: CollectionLog['status'][] = ['completed', 'completed', 'completed', 'completed', 'delayed']

  let id = 1
  const today = new Date()
  const holidaySet = new Set(holidays.filter(h => !h.isWorkday).map(h => h.date))

  binPoints.forEach(bin => {
    for (let day = 0; day < 30; day++) {
      const date = new Date(today)
      date.setDate(date.getDate() - day)
      const dateStr = formatDate(date)
      const isHoliday = holidaySet.has(dateStr)

      if (isHoliday && Math.random() > 0.3) continue

      timeWindows.forEach(window => {
        if (Math.random() > 0.7) return

        const planHour = parseInt(window.split(' ')[1].split(':')[0])
        const planTime = new Date(date)
        planTime.setHours(planHour, randomInt(0, 30), 0, 0)

        const status = randomChoice(statuses)
        const delay = status === 'delayed' ? randomInt(30, 120) : randomInt(-10, 20)
        const actualTime = new Date(planTime.getTime() + delay * 60000)

        logs.push({
          id: `collect-${String(id).padStart(6, '0')}`,
          binPointId: bin.id,
          planTime: formatDateTime(planTime),
          actualTime: formatDateTime(actualTime),
          timeWindow: window,
          isHoliday,
          status,
          vehicleNo: '京A' + String(randomInt(10000, 99999))
        })
        id++
      })
    }
  })

  return logs
}

export function generateInspectionPhotos(binPoints: BinPoint[]): InspectionPhoto[] {
  const photos: InspectionPhoto[] = []
  const uploaders = ['巡查员1', '巡查员2', '巡查员3', '巡查员4', '巡查员5']
  const auditStatuses: InspectionPhoto['auditStatus'][] = ['pending', 'pending', 'approved', 'approved', 'rejected']

  let id = 1
  const today = new Date()

  binPoints.forEach(bin => {
    const count = randomInt(3, 15)
    for (let i = 0; i < count; i++) {
      const uploadTime = new Date(today.getTime() - randomInt(0, 30 * 86400000))
      const auditStatus = randomChoice(auditStatuses)

      photos.push({
        id: `photo-${String(id).padStart(6, '0')}`,
        binPointId: bin.id,
        uploader: randomChoice(uploaders),
        uploadTime: formatDateTime(uploadTime),
        photoUrl: `https://picsum.photos/seed/photo${id}/400/300`,
        auditStatus
      })
      id++
    }
  })

  return photos
}

export function generateAuditLogs(photos: InspectionPhoto[]): AuditLog[] {
  const logs: AuditLog[] = []
  const auditors = ['审核员1', '审核员2', '审核员3']
  const rejectReasons = [
    '照片模糊，无法识别',
    '拍摄角度不正确',
    '未拍摄到完整桶点',
    '照片与桶点不匹配',
    '光线过暗，无法判断'
  ]

  let id = 1

  photos.filter(p => p.auditStatus !== 'pending').forEach(photo => {
    const auditTime = new Date(new Date(photo.uploadTime).getTime() + randomInt(30, 360) * 60000)

    logs.push({
      id: `audit-${String(id).padStart(6, '0')}`,
      photoId: photo.id,
      auditor: randomChoice(auditors),
      auditTime: formatDateTime(auditTime),
      result: photo.auditStatus === 'approved' ? 'approved' : 'rejected',
      rejectReason: photo.auditStatus === 'rejected' ? randomChoice(rejectReasons) : undefined
    })
    id++
  })

  return logs
}

export function generateReturnVisits(binPoints: BinPoint[]): ReturnVisit[] {
  const visits: ReturnVisit[] = []
  const visitors = ['项目经理1', '项目经理2', '巡查组长1']
  const issueTypes = ['误投率高', '桶满未清运', '设施损坏', '周边脏乱', '居民投诉']
  const statuses: ReturnVisit['status'][] = ['pending', 'completed', 'completed']

  let id = 1
  const today = new Date()

  binPoints.filter(b => b.status === 'abnormal' || b.status === 'warning').forEach(bin => {
    const count = randomInt(0, 3)
    for (let i = 0; i < count; i++) {
      const visitTime = new Date(today.getTime() - randomInt(0, 15 * 86400000))
      const status = randomChoice(statuses)

      visits.push({
        id: `visit-${String(id).padStart(6, '0')}`,
        binPointId: bin.id,
        visitTime: formatDateTime(visitTime),
        visitor: randomChoice(visitors),
        issueType: randomChoice(issueTypes),
        rectification: status === 'completed' ? '已完成整改，问题解决' : '整改中，预计3日内完成',
        status
      })
      id++
    }
  })

  return visits
}

export function generateHolidaySchedules(): HolidaySchedule[] {
  const holidays: HolidaySchedule[] = []
  const holidayNames = [
    { name: '元旦', month: 1, day: 1 },
    { name: '春节', month: 2, day: 10 },
    { name: '清明节', month: 4, day: 4 },
    { name: '劳动节', month: 5, day: 1 },
    { name: '端午节', month: 6, day: 10 },
    { name: '中秋节', month: 9, day: 17 },
    { name: '国庆节', month: 10, day: 1 }
  ]

  const year = new Date().getFullYear()

  holidayNames.forEach(h => {
    const date = new Date(year, h.month - 1, h.day)
    for (let i = 0; i < 3; i++) {
      const d = new Date(date)
      d.setDate(d.getDate() + i)
      holidays.push({
        date: formatDate(d),
        name: h.name,
        isWorkday: false
      })
    }
  })

  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= 28; d++) {
      const date = new Date(year, m, d)
      const day = date.getDay()
      if (day === 0 || day === 6) {
        const dateStr = formatDate(date)
        if (!holidays.find(h => h.date === dateStr)) {
          holidays.push({
            date: dateStr,
            name: day === 0 ? '周日' : '周六',
            isWorkday: false
          })
        }
      }
    }
  }

  return holidays
}

export const mockUsers: User[] = [
  { id: 'user-001', name: '张经理', role: 'manager', avatar: 'https://picsum.photos/seed/mgr1/100/100' },
  { id: 'user-002', name: '李审核', role: 'auditor', avatar: 'https://picsum.photos/seed/audit1/100/100' }
]

export function generateCityGeoJson(): GeoJson {
  const centerLng = 116.4074
  const centerLat = 39.9042

  const features: any[] = []

  districts.forEach((district, i) => {
    const angle = (i / districts.length) * Math.PI * 2
    const radius = 0.06
    const cx = centerLng + Math.cos(angle) * radius
    const cy = centerLat + Math.sin(angle) * radius

    const coordinates: [number, number][] = []
    const sides = 8
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2
      const r = 0.035 + randomRange(-0.005, 0.005)
      coordinates.push([
        cx + Math.cos(a) * r,
        cy + Math.sin(a) * r
      ])
    }
    coordinates.push(coordinates[0])

    features.push({
      type: 'Feature',
      properties: { name: district, id: `district-${i + 1}` },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    })
  })

  return {
    type: 'FeatureCollection',
    features
  }
}

export function initMockData() {
  const communities = generateCommunities()
  const binPoints = generateBinPoints(communities)
  const holidays = generateHolidaySchedules()
  const misuseRecords = generateMisuseRecords(binPoints)
  const fullAlerts = generateFullAlerts(binPoints)
  const collectionLogs = generateCollectionLogs(binPoints, holidays)
  const inspectionPhotos = generateInspectionPhotos(binPoints)
  const auditLogs = generateAuditLogs(inspectionPhotos)
  const returnVisits = generateReturnVisits(binPoints)
  const cityGeoJson = generateCityGeoJson()

  return {
    communities,
    binPoints,
    holidays,
    misuseRecords,
    fullAlerts,
    collectionLogs,
    inspectionPhotos,
    auditLogs,
    returnVisits,
    cityGeoJson,
    users: mockUsers
  }
}

export type MockData = ReturnType<typeof initMockData>
