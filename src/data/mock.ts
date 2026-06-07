import type { DowntimeRecord, Annotation, EquipmentOption } from '@/types'

const PRODUCTION_LINES = ['A线', 'B线', 'C线', 'D线']
const SHIFTS = ['早班', '中班', '夜班']
const FAULT_TYPES = ['机械故障', '电气故障', '液压故障', '润滑故障', '控制系统故障', '传动故障', '冷却故障', '气动故障']
const MAINTENANCE_PEOPLE = ['张工', '李工', '王工', '赵工', '刘工', '陈工', '杨工', '黄工']
const EQUIPMENT_NAMES: Record<string, string[]> = {
  'A线': ['A-CNC-01', 'A-CNC-02', 'A-CNC-03', 'A-ROBOT-01', 'A-CONV-01'],
  'B线': ['B-CNC-01', 'B-CNC-02', 'B-PRESS-01', 'B-ROBOT-01', 'B-CONV-01'],
  'C线': ['C-CNC-01', 'C-CNC-02', 'C-LATHE-01', 'C-ROBOT-01', 'C-CONV-01'],
  'D线': ['D-CNC-01', 'D-MILL-01', 'D-DRILL-01', 'D-ROBOT-01', 'D-CONV-01'],
}
const SPARE_PARTS = [
  { partId: 'sp001', partName: '轴承 6205', unitCost: 45 },
  { partId: 'sp002', partName: '密封圈 DN50', unitCost: 12 },
  { partId: 'sp003', partName: '液压油管 φ12', unitCost: 88 },
  { partId: 'sp004', partName: '接触器 CJX2-25', unitCost: 156 },
  { partId: 'sp005', partName: '伺服电机 750W', unitCost: 2800 },
  { partId: 'sp006', partName: '编码器线缆 5m', unitCost: 320 },
  { partId: 'sp007', partName: '滤芯 HF-40', unitCost: 68 },
  { partId: 'sp008', partName: '皮带 5M-450', unitCost: 35 },
  { partId: 'sp009', partName: '气缸 SC-63', unitCost: 420 },
  { partId: 'sp010', partName: '变频器 2.2kW', unitCost: 1650 },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)

function randomInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function randomSubset<T>(arr: T[], minSize: number, maxSize: number): T[] {
  const size = randomInt(minSize, Math.min(maxSize, arr.length))
  const shuffled = [...arr].sort(() => rand() - 0.5)
  return shuffled.slice(0, size)
}

function generateDateRange(): [string, string] {
  const end = new Date(2026, 5, 6)
  const start = new Date(2026, 2, 1)
  return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
}

function generateRecords(): DowntimeRecord[] {
  const records: DowntimeRecord[] = []
  const [startDate] = generateDateRange()
  const startMs = new Date(startDate).getTime()
  const rangeMs = 97 * 24 * 60 * 60 * 1000

  for (let i = 0; i < 320; i++) {
    const line = randomChoice(PRODUCTION_LINES)
    const equipName = randomChoice(EQUIPMENT_NAMES[line])
    const equipId = `${line}-${equipName}`
    const faultType = randomChoice(FAULT_TYPES)
    const isPlanned = rand() < 0.35
    const person = randomChoice(MAINTENANCE_PEOPLE)
    const shift = randomChoice(SHIFTS)

    const eventStartMs = startMs + Math.floor(rand() * rangeMs)
    const duration = isPlanned
      ? randomInt(60, 480)
      : randomInt(15, 360)
    const maintDuration = Math.floor(duration * (0.6 + rand() * 0.35))

    const startTime = new Date(eventStartMs).toISOString()
    const endTime = new Date(eventStartMs + duration * 60 * 1000).toISOString()

    const numParts = randomInt(0, 3)
    const spareParts = []
    for (let p = 0; p < numParts; p++) {
      const part = randomChoice(SPARE_PARTS)
      spareParts.push({
        partId: part.partId,
        partName: part.partName,
        quantity: randomInt(1, 5),
        unitCost: part.unitCost,
      })
    }

    records.push({
      id: `wo-${String(i + 1).padStart(4, '0')}`,
      equipmentId: equipId,
      equipmentName: equipName,
      productionLine: line,
      shift,
      faultType,
      downtimeType: isPlanned ? 'planned' : 'unplanned',
      startTime,
      endTime,
      duration,
      maintenancePerson: person,
      maintenanceDuration: maintDuration,
      spareParts,
    })
  }

  return records.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

const MOCK_RECORDS = generateRecords()

const DEFAULT_ANNOTATIONS: Annotation[] = [
  {
    id: 'ann-001',
    date: '2026-04-12',
    content: 'A线CNC-01主轴轴承更换，属计划性大修',
    author: '张工',
    createdAt: '2026-04-12T14:30:00',
    tags: ['计划检修', '轴承更换'],
  },
  {
    id: 'ann-002',
    date: '2026-05-03',
    content: 'B线液压系统突发泄露，紧急停机处理',
    author: '李工',
    createdAt: '2026-05-03T09:15:00',
    tags: ['突发停机', '液压泄露'],
  },
  {
    id: 'ann-003',
    date: '2026-05-20',
    content: 'C线机器人控制器故障，更换主板后恢复',
    author: '王工',
    createdAt: '2026-05-20T16:45:00',
    tags: ['突发停机', '控制器'],
  },
]

export function getMockRecords(): DowntimeRecord[] {
  return MOCK_RECORDS
}

export function getDefaultAnnotations(): Annotation[] {
  return DEFAULT_ANNOTATIONS
}

export function getEquipmentOptions(): EquipmentOption[] {
  const options: EquipmentOption[] = []
  for (const [line, names] of Object.entries(EQUIPMENT_NAMES)) {
    for (const name of names) {
      options.push({ id: `${line}-${name}`, name, productionLine: line })
    }
  }
  return options
}

export function getProductionLines(): string[] {
  return PRODUCTION_LINES
}

export function getShifts(): string[] {
  return SHIFTS
}

export function getFaultTypes(): string[] {
  return FAULT_TYPES
}

export function getMaintenancePeople(): string[] {
  return MAINTENANCE_PEOPLE
}

export function getDateRange(): [string, string] {
  return generateDateRange()
}
