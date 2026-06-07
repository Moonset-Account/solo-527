import type {
  DowntimeRecord,
  Annotation,
  EquipmentOption,
  EquipmentRuntimeRaw,
  AlarmRecordRaw,
  MaintenanceOrderRaw,
  ShiftGroupRaw,
  ProductionOutputRaw,
  SparePartConsumptionRaw,
} from '@/types'
import { cleanDowntimeData } from '@/data/clean'

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
const ALARM_TYPES = ['过载报警', '温度超限', '振动异常', '压力异常', '位置偏差', '通信故障', '电源异常', '安全联锁']
const SHIFT_LEADERS: Record<string, string[]> = {
  '早班': ['周组长', '吴组长'],
  '中班': ['郑组长', '孙组长'],
  '夜班': ['马组长', '朱组长'],
}
const TEAM_MEMBERS = ['工人甲', '工人乙', '工人丙', '工人丁', '工人戊', '工人己', '工人庚', '工人辛', '工人壬', '工人癸']

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function makeHelpers(rand: () => number) {
  const randomInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
  const randomChoice = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  return { randomInt, randomChoice }
}

function generateDateRange(): [string, string] {
  const end = new Date(2026, 5, 6)
  const start = new Date(2026, 2, 1)
  return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
}

function generateEquipmentRuntime(): EquipmentRuntimeRaw[] {
  const rand = seededRandom(101)
  const { randomInt, randomChoice } = makeHelpers(rand)
  const records: EquipmentRuntimeRaw[] = []
  const [startDate] = generateDateRange()
  const startMs = new Date(startDate).getTime()
  const rangeMs = 97 * 24 * 60 * 60 * 1000

  for (let i = 0; i < 2000; i++) {
    const line = randomChoice(PRODUCTION_LINES)
    const equipName = randomChoice(EQUIPMENT_NAMES[line])
    const shift = randomChoice(SHIFTS)
    const eventMs = startMs + Math.floor(rand() * rangeMs)
    const r = rand()
    const status: EquipmentRuntimeRaw['status'] = r < 0.75 ? 'running' : r < 0.90 ? 'stopped' : 'maintenance'
    const duration = status === 'running' ? randomInt(60, 480) : status === 'stopped' ? randomInt(5, 120) : randomInt(30, 360)

    records.push({
      id: `er-${String(i + 1).padStart(5, '0')}`,
      equipmentId: `${line}-${equipName}`,
      productionLine: line,
      shift,
      timestamp: new Date(eventMs).toISOString(),
      status,
      duration,
    })
  }

  return records.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function generateAlarmRecords(): AlarmRecordRaw[] {
  const rand = seededRandom(202)
  const { randomChoice } = makeHelpers(rand)
  const records: AlarmRecordRaw[] = []
  const [startDate] = generateDateRange()
  const startMs = new Date(startDate).getTime()
  const rangeMs = 97 * 24 * 60 * 60 * 1000
  const severities: AlarmRecordRaw['severity'][] = ['low', 'medium', 'high', 'critical']

  for (let i = 0; i < 495; i++) {
    const line = randomChoice(PRODUCTION_LINES)
    const equipName = randomChoice(EQUIPMENT_NAMES[line])
    const alarmMs = startMs + Math.floor(rand() * rangeMs)

    records.push({
      id: `al-${String(i + 1).padStart(5, '0')}`,
      equipmentId: `${line}-${equipName}`,
      alarmType: randomChoice(ALARM_TYPES),
      faultType: randomChoice(FAULT_TYPES),
      alarmTime: new Date(alarmMs).toISOString(),
      severity: randomChoice(severities),
    })
  }

  for (let i = 495; i < 500; i++) {
    const alarmMs = startMs + Math.floor(rand() * rangeMs)
    records.push({
      id: `al-${String(i + 1).padStart(5, '0')}`,
      equipmentId: `X线-UNKNOWN-${String(i - 494).padStart(2, '0')}`,
      alarmType: randomChoice(ALARM_TYPES),
      faultType: randomChoice(FAULT_TYPES),
      alarmTime: new Date(alarmMs).toISOString(),
      severity: randomChoice(severities),
    })
  }

  return records.sort((a, b) => a.alarmTime.localeCompare(b.alarmTime))
}

function generateMaintenanceOrders(): MaintenanceOrderRaw[] {
  const rand = seededRandom(303)
  const { randomInt, randomChoice } = makeHelpers(rand)
  const records: MaintenanceOrderRaw[] = []
  const [startDate] = generateDateRange()
  const startMs = new Date(startDate).getTime()
  const rangeMs = 97 * 24 * 60 * 60 * 1000

  for (let i = 0; i < 315; i++) {
    const line = randomChoice(PRODUCTION_LINES)
    const equipName = randomChoice(EQUIPMENT_NAMES[line])
    const faultType = randomChoice(FAULT_TYPES)
    const isPlanned = rand() < 0.35
    const person = randomChoice(MAINTENANCE_PEOPLE)
    const eventStartMs = startMs + Math.floor(rand() * rangeMs)
    const duration = isPlanned ? randomInt(60, 480) : randomInt(15, 360)
    const startTime = new Date(eventStartMs).toISOString()
    const endTime = new Date(eventStartMs + duration * 60 * 1000).toISOString()

    records.push({
      id: `wo-${String(i + 1).padStart(4, '0')}`,
      equipmentId: `${line}-${equipName}`,
      faultType,
      downtimeType: isPlanned ? 'planned' : 'unplanned',
      maintenancePerson: person,
      startTime,
      endTime,
      repairDuration: Math.floor(duration * (0.6 + rand() * 0.35)),
    })
  }

  for (let i = 315; i < 318; i++) {
    const line = randomChoice(PRODUCTION_LINES)
    const equipName = randomChoice(EQUIPMENT_NAMES[line])
    const eventStartMs = startMs + Math.floor(rand() * rangeMs)
    const duration = randomInt(15, 360)
    records.push({
      id: `wo-${String(i + 1).padStart(4, '0')}`,
      equipmentId: `${line}-${equipName}`,
      faultType: randomChoice(FAULT_TYPES),
      downtimeType: 'unplanned',
      maintenancePerson: '',
      startTime: new Date(eventStartMs).toISOString(),
      endTime: new Date(eventStartMs + duration * 60 * 1000).toISOString(),
      repairDuration: duration,
    })
  }

  for (let i = 318; i < 320; i++) {
    const line = randomChoice(PRODUCTION_LINES)
    const equipName = randomChoice(EQUIPMENT_NAMES[line])
    const eventStartMs = startMs + Math.floor(rand() * rangeMs)
    records.push({
      id: `wo-${String(i + 1).padStart(4, '0')}`,
      equipmentId: `${line}-${equipName}`,
      faultType: randomChoice(FAULT_TYPES),
      downtimeType: 'unplanned',
      maintenancePerson: randomChoice(MAINTENANCE_PEOPLE),
      startTime: new Date(eventStartMs).toISOString(),
      endTime: '',
      repairDuration: 0,
    })
  }

  return records.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function generateShiftGroups(): ShiftGroupRaw[] {
  const rand = seededRandom(404)
  const { randomInt, randomChoice } = makeHelpers(rand)
  const records: ShiftGroupRaw[] = []
  const [startDate] = generateDateRange()
  const startMs = new Date(startDate).getTime()

  for (let d = 0; d < 30; d++) {
    const dateStr = new Date(startMs + d * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    for (const shift of SHIFTS) {
      const leader = randomChoice(SHIFT_LEADERS[shift])
      const memberCount = randomInt(4, 8)
      const shuffled = [...TEAM_MEMBERS].sort(() => rand() - 0.5)
      const members = shuffled.slice(0, memberCount)
      records.push({
        id: `sg-${String(records.length + 1).padStart(4, '0')}`,
        shiftName: shift,
        leader,
        members,
        scheduleDate: dateStr,
      })
    }
  }

  return records
}

function generateProductionOutput(): ProductionOutputRaw[] {
  const rand = seededRandom(505)
  const { randomInt } = makeHelpers(rand)
  const records: ProductionOutputRaw[] = []
  const [startDate] = generateDateRange()
  const startMs = new Date(startDate).getTime()

  for (let d = 0; d < 30; d++) {
    const dateStr = new Date(startMs + d * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    for (const line of PRODUCTION_LINES) {
      for (const shift of SHIFTS) {
        const target = randomInt(800, 1200)
        const output = Math.floor(target * (0.7 + rand() * 0.35))
        records.push({
          id: `po-${String(records.length + 1).padStart(4, '0')}`,
          productionLine: line,
          shift,
          date: dateStr,
          output,
          target,
        })
      }
    }
  }

  return records
}

function generateSparePartConsumption(): SparePartConsumptionRaw[] {
  const rand = seededRandom(606)
  const { randomInt, randomChoice } = makeHelpers(rand)
  const records: SparePartConsumptionRaw[] = []
  const [startDate] = generateDateRange()
  const startMs = new Date(startDate).getTime()
  const rangeMs = 97 * 24 * 60 * 60 * 1000

  for (let i = 0; i < 245; i++) {
    const workOrderId = `wo-${String(randomInt(1, 320)).padStart(4, '0')}`
    const part = randomChoice(SPARE_PARTS)
    const quantity = randomInt(1, 5)
    const consumedMs = startMs + Math.floor(rand() * rangeMs)
    records.push({
      id: `spc-${String(i + 1).padStart(5, '0')}`,
      workOrderId,
      partName: part.partName,
      quantity,
      unitCost: part.unitCost,
      consumedAt: new Date(consumedMs).toISOString(),
    })
  }

  for (let i = 245; i < 250; i++) {
    const part = randomChoice(SPARE_PARTS)
    const quantity = randomInt(1, 5)
    const consumedMs = startMs + Math.floor(rand() * rangeMs)
    records.push({
      id: `spc-${String(i + 1).padStart(5, '0')}`,
      workOrderId: `wo-${String(randomInt(9000, 9999)).padStart(4, '0')}`,
      partName: part.partName,
      quantity,
      unitCost: part.unitCost,
      consumedAt: new Date(consumedMs).toISOString(),
    })
  }

  return records.sort((a, b) => a.consumedAt.localeCompare(b.consumedAt))
}

const EQUIPMENT_RUNTIME_RAW = generateEquipmentRuntime()
const ALARM_RECORDS_RAW = generateAlarmRecords()
const MAINTENANCE_ORDERS_RAW = generateMaintenanceOrders()
const SHIFT_GROUPS_RAW = generateShiftGroups()
const PRODUCTION_OUTPUT_RAW = generateProductionOutput()
const SPARE_PART_CONSUMPTION_RAW = generateSparePartConsumption()

const PIPELINE_RESULT = cleanDowntimeData()

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
  return PIPELINE_RESULT.records
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

export function getEquipmentRuntimeRaw(): EquipmentRuntimeRaw[] {
  return EQUIPMENT_RUNTIME_RAW
}

export function getAlarmRecordsRaw(): AlarmRecordRaw[] {
  return ALARM_RECORDS_RAW
}

export function getMaintenanceOrdersRaw(): MaintenanceOrderRaw[] {
  return MAINTENANCE_ORDERS_RAW
}

export function getShiftGroupsRaw(): ShiftGroupRaw[] {
  return SHIFT_GROUPS_RAW
}

export function getProductionOutputRaw(): ProductionOutputRaw[] {
  return PRODUCTION_OUTPUT_RAW
}

export function getSparePartConsumptionRaw(): SparePartConsumptionRaw[] {
  return SPARE_PART_CONSUMPTION_RAW
}
