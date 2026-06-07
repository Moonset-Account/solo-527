import type { Equipment, MaintenancePerson, DowntimeRecord, SparePartConsumption } from '../types'

export const productionLines = ['A线', 'B线', 'C线', 'D线'] as const
export const shifts = ['早班', '中班', '夜班'] as const

export const faultTypes = [
  '机械故障',
  '电气故障',
  '液压故障',
  '气动故障',
  '传感器异常',
  'PLC通信异常',
  '模具损坏',
  '润滑异常',
  '过热保护',
  '安全联锁触发',
]

export const equipments: Equipment[] = [
  { id: 'EQ-A01', name: '1号注塑机', productionLine: 'A线', equipmentType: '注塑机' },
  { id: 'EQ-A02', name: '2号注塑机', productionLine: 'A线', equipmentType: '注塑机' },
  { id: 'EQ-A03', name: '3号注塑机', productionLine: 'A线', equipmentType: '注塑机' },
  { id: 'EQ-A04', name: '1号冲压机', productionLine: 'A线', equipmentType: '冲压机' },
  { id: 'EQ-B01', name: '1号焊接机器人', productionLine: 'B线', equipmentType: '焊接机器人' },
  { id: 'EQ-B02', name: '2号焊接机器人', productionLine: 'B线', equipmentType: '焊接机器人' },
  { id: 'EQ-B03', name: '1号涂装线', productionLine: 'B线', equipmentType: '涂装线' },
  { id: 'EQ-B04', name: '2号涂装线', productionLine: 'B线', equipmentType: '涂装线' },
  { id: 'EQ-C01', name: '1号装配线', productionLine: 'C线', equipmentType: '装配线' },
  { id: 'EQ-C02', name: '2号装配线', productionLine: 'C线', equipmentType: '装配线' },
  { id: 'EQ-C03', name: '1号检测台', productionLine: 'C线', equipmentType: '检测台' },
  { id: 'EQ-C04', name: '2号检测台', productionLine: 'C线', equipmentType: '检测台' },
  { id: 'EQ-D01', name: '1号包装机', productionLine: 'D线', equipmentType: '包装机' },
  { id: 'EQ-D02', name: '2号包装机', productionLine: 'D线', equipmentType: '包装机' },
  { id: 'EQ-D03', name: '1号输送带', productionLine: 'D线', equipmentType: '输送带' },
  { id: 'EQ-D04', name: '2号输送带', productionLine: 'D线', equipmentType: '输送带' },
]

export const maintenancePersons: MaintenancePerson[] = [
  { id: 'MP-01', name: '张伟', team: '机械维修组' },
  { id: 'MP-02', name: '李强', team: '机械维修组' },
  { id: 'MP-03', name: '王磊', team: '电气维修组' },
  { id: 'MP-04', name: '赵鹏', team: '电气维修组' },
  { id: 'MP-05', name: '陈刚', team: '液压维修组' },
  { id: 'MP-06', name: '刘洋', team: '液压维修组' },
  { id: 'MP-07', name: '周军', team: '综合维修组' },
  { id: 'MP-08', name: '吴勇', team: '综合维修组' },
  { id: 'MP-09', name: '孙明', team: '电气维修组' },
]

const sparePartsCatalog: Record<string, { partId: string; partName: string; unitCost: number }[]> = {
  机械故障: [
    { partId: 'SP-M01', partName: '轴承', unitCost: 320 },
    { partId: 'SP-M02', partName: '联轴器', unitCost: 580 },
    { partId: 'SP-M03', partName: '齿轮', unitCost: 450 },
    { partId: 'SP-M04', partName: '皮带', unitCost: 120 },
  ],
  电气故障: [
    { partId: 'SP-E01', partName: '接触器', unitCost: 260 },
    { partId: 'SP-E02', partName: '继电器', unitCost: 180 },
    { partId: 'SP-E03', partName: '变频器', unitCost: 2800 },
    { partId: 'SP-E04', partName: '保险丝', unitCost: 15 },
  ],
  液压故障: [
    { partId: 'SP-H01', partName: '液压油缸', unitCost: 1500 },
    { partId: 'SP-H02', partName: '密封圈', unitCost: 35 },
    { partId: 'SP-H03', partName: '液压阀', unitCost: 680 },
    { partId: 'SP-H04', partName: '油管', unitCost: 95 },
  ],
  气动故障: [
    { partId: 'SP-P01', partName: '气缸', unitCost: 420 },
    { partId: 'SP-P02', partName: '电磁阀', unitCost: 350 },
    { partId: 'SP-P03', partName: '气管接头', unitCost: 28 },
  ],
  传感器异常: [
    { partId: 'SP-S01', partName: '光电传感器', unitCost: 280 },
    { partId: 'SP-S02', partName: '温度传感器', unitCost: 190 },
    { partId: 'SP-S03', partName: '压力传感器', unitCost: 350 },
  ],
  'PLC通信异常': [
    { partId: 'SP-C01', partName: '通信模块', unitCost: 1200 },
    { partId: 'SP-C02', partName: '网线', unitCost: 25 },
    { partId: 'SP-C03', partName: '交换机', unitCost: 680 },
  ],
  模具损坏: [
    { partId: 'SP-D01', partName: '冲头', unitCost: 960 },
    { partId: 'SP-D02', partName: '模架', unitCost: 3200 },
    { partId: 'SP-D03', partName: '弹簧', unitCost: 45 },
  ],
  润滑异常: [
    { partId: 'SP-L01', partName: '润滑泵', unitCost: 520 },
    { partId: 'SP-L02', partName: '润滑油', unitCost: 85 },
    { partId: 'SP-L03', partName: '分配器', unitCost: 230 },
  ],
  过热保护: [
    { partId: 'SP-T01', partName: '散热风扇', unitCost: 180 },
    { partId: 'SP-T02', partName: '热保护器', unitCost: 95 },
  ],
  安全联锁触发: [
    { partId: 'SP-SF01', partName: '安全开关', unitCost: 320 },
    { partId: 'SP-SF02', partName: '光幕', unitCost: 2400 },
  ],
}

function generateSpareParts(faultType: string): SparePartConsumption[] {
  const catalog = sparePartsCatalog[faultType]
  if (!catalog) return []
  const count = Math.random() < 0.3 ? 2 : 1
  const shuffled = [...catalog].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((item) => ({
    partId: item.partId,
    partName: item.partName,
    quantity: Math.floor(Math.random() * 3) + 1,
    unitCost: item.unitCost,
  }))
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function getShiftForHour(hour: number): '早班' | '中班' | '夜班' {
  if (hour >= 6 && hour < 14) return '早班'
  if (hour >= 14 && hour < 22) return '中班'
  return '夜班'
}

function seedRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seedRandom(20240601)

function generateDowntimeRecords(): DowntimeRecord[] {
  const records: DowntimeRecord[] = []
  const today = new Date(2026, 5, 8)

  const plannedFaultTypes = ['润滑异常', '过热保护', '安全联锁触发']
  const unplannedFaultTypes = [
    '机械故障', '电气故障', '液压故障', '气动故障',
    '传感器异常', 'PLC通信异常', '模具损坏',
  ]

  const allFaultTypes = [...plannedFaultTypes, ...unplannedFaultTypes]
  const plannedWeight = 0.3

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)

    const dailyRecordCount = Math.floor(rand() * 3) + 2

    for (let i = 0; i < dailyRecordCount; i++) {
      const isPlanned = rand() < plannedWeight

      let faultType: string
      if (isPlanned) {
        faultType = plannedFaultTypes[Math.floor(rand() * plannedFaultTypes.length)]
      } else {
        faultType = unplannedFaultTypes[Math.floor(rand() * unplannedFaultTypes.length)]
      }

      const eq = equipments[Math.floor(rand() * equipments.length)]
      const mp = maintenancePersons[Math.floor(rand() * maintenancePersons.length)]

      const startHour = Math.floor(rand() * 20) + 2
      const startMinute = Math.floor(rand() * 60)
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute)

      const downtimeMinutes = isPlanned
        ? Math.floor(rand() * 180) + 60
        : Math.floor(rand() * 465) + 15

      const endDate = new Date(startDate.getTime() + downtimeMinutes * 60000)

      const responseDelay = Math.floor(rand() * 25) + 5
      const repairStart = new Date(startDate.getTime() + responseDelay * 60000)
      const repairMinutes = Math.max(10, downtimeMinutes - responseDelay - Math.floor(rand() * 20))
      const repairEnd = new Date(repairStart.getTime() + repairMinutes * 60000)

      const spareParts = !isPlanned ? generateSpareParts(faultType) : []

      const dayStr = String(date.getDate()).padStart(2, '0')
      const monthStr = String(date.getMonth() + 1).padStart(2, '0')
      const recordId = `DR-${date.getFullYear()}${monthStr}${dayStr}-${String(records.length + 1).padStart(3, '0')}`

      records.push({
        id: recordId,
        equipmentId: eq.id,
        equipmentName: eq.name,
        productionLine: eq.productionLine,
        shift: getShiftForHour(startHour),
        faultType,
        downtimeStart: formatDateTime(startDate),
        downtimeEnd: formatDateTime(endDate),
        downtimeMinutes,
        isPlanned,
        maintenancePersonId: mp.id,
        maintenancePersonName: mp.name,
        repairStart: formatDateTime(repairStart),
        repairEnd: formatDateTime(repairEnd),
        repairMinutes,
        spareParts,
      })
    }
  }

  return records
}

export const downtimeRecords: DowntimeRecord[] = generateDowntimeRecords()
