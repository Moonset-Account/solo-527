import type { AppointmentRecord, CaliberDefinition, Note } from '../../shared/types.js'

const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三']
const COUNSELING_TYPES = ['情绪困扰', '学业压力', '人际关系', '职业规划', '家庭问题', '自我认知', '危机干预', '适应障碍']
const CHANNELS = ['线上预约', '线下窗口', '辅导员转介', '家长转介', '朋辈推荐']
const STATUSES: AppointmentRecord['status'][] = ['appointed', 'completed', 'cancelled', 'noShow']
const CANCEL_REASONS = ['时间冲突', '自行缓解', '已转介', '临时有事', '对咨询顾虑', '其他']
const FOLLOW_UP_STATUSES: AppointmentRecord['followUpStatus'][] = ['pending', 'completed', 'overdue']
const BUILDING_AREAS = [
  { name: '图书馆', lng: 116.3264, lat: 39.9752 },
  { name: '学生活动中心', lng: 116.3278, lat: 39.9741 },
  { name: '教学楼A', lng: 116.3251, lat: 39.9768 },
  { name: '教学楼B', lng: 116.3285, lat: 39.9763 },
  { name: '宿舍区1', lng: 116.3240, lat: 39.9735 },
  { name: '宿舍区2', lng: 116.3295, lat: 39.9730 },
  { name: '行政楼', lng: 116.3260, lat: 39.9775 },
  { name: '心理咨询中心', lng: 116.3270, lat: 39.9756 },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateId(): string {
  return `REC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}

function generateAnonymousId(rand: () => number): string {
  const prefix = ['S', 'T', 'U', 'V'][Math.floor(rand() * 4)]
  const num = Math.floor(rand() * 9000 + 1000)
  return `${prefix}${num}`
}

function generateRecords(count: number, startDate: string, endDate: string): AppointmentRecord[] {
  const rand = seededRandom(42)
  const records: AppointmentRecord[] = []
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()

  for (let i = 0; i < count; i++) {
    const appointmentTime = new Date(start + rand() * (end - start))
    const status = STATUSES[Math.floor(rand() * STATUSES.length)]
    const statusWeight = rand()
    let finalStatus: AppointmentRecord['status']
    if (statusWeight < 0.55) finalStatus = 'completed'
    else if (statusWeight < 0.72) finalStatus = 'appointed'
    else if (statusWeight < 0.90) finalStatus = 'cancelled'
    else finalStatus = 'noShow'

    const waitDays = Math.floor(rand() * 20 + 0.5)
    const building = BUILDING_AREAS[Math.floor(rand() * BUILDING_AREAS.length)]

    const followUpWeight = rand()
    let followUpStatus: AppointmentRecord['followUpStatus']
    if (finalStatus === 'completed') {
      if (followUpWeight < 0.6) followUpStatus = 'completed'
      else if (followUpWeight < 0.85) followUpStatus = 'pending'
      else followUpStatus = 'overdue'
    } else {
      followUpStatus = 'pending'
    }

    const gradeIdx = Math.floor(rand() * GRADES.length)
    const typeIdx = Math.floor(rand() * COUNSELING_TYPES.length)
    const channelIdx = Math.floor(rand() * CHANNELS.length)

    const record: AppointmentRecord = {
      id: generateId(),
      anonymousId: generateAnonymousId(rand),
      grade: GRADES[gradeIdx],
      counselingType: COUNSELING_TYPES[typeIdx],
      channel: CHANNELS[channelIdx],
      status: finalStatus,
      waitDays,
      cancelReason: finalStatus === 'cancelled' ? CANCEL_REASONS[Math.floor(rand() * CANCEL_REASONS.length)] : undefined,
      followUpStatus,
      appointmentDate: appointmentTime.toISOString().split('T')[0],
      buildingArea: building.name,
      lng: building.lng + (rand() - 0.5) * 0.002,
      lat: building.lat + (rand() - 0.5) * 0.002,
    }
    records.push(record)
  }

  return records.sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
}

export const mockRecords: AppointmentRecord[] = generateRecords(600, '2025-06-01', '2026-05-31')

export const mockNotes: Note[] = [
  {
    id: 'NOTE-001',
    targetKey: 'grade:大三:cancelRate',
    content: '大三取消率异常偏高，可能与期末考试季时间冲突有关，建议下学期考前增加预约时段',
    author: '张老师',
    createdAt: '2026-03-15T10:30:00Z',
  },
  {
    id: 'NOTE-002',
    targetKey: 'counselingType:危机干预:avgWaitDays',
    content: '危机干预平均等待天数超过7天，需优先排期，已向中心负责人汇报',
    author: '李老师',
    createdAt: '2026-04-02T14:20:00Z',
  },
]

export const caliberDefinitions: CaliberDefinition[] = [
  {
    metricKey: 'appointmentCount',
    metricName: '预约数',
    definition: '统计周期内所有状态为已预约、已完成、已取消、未到的记录总数',
    formula: 'COUNT(*) WHERE appointment_date IN [start, end]',
    updateTime: '2026-01-01T00:00:00Z',
  },
  {
    metricKey: 'cancelRate',
    metricName: '取消率',
    definition: '已取消预约数占已完成+已取消+未到预约数的比例',
    formula: 'COUNT(status=cancelled) / COUNT(status IN (completed, cancelled, noShow))',
    updateTime: '2026-01-01T00:00:00Z',
  },
  {
    metricKey: 'avgWaitDays',
    metricName: '平均等待天数',
    definition: '从预约创建到首次咨询之间的平均等待天数（仅计算已完成和已预约状态）',
    formula: 'AVG(wait_days) WHERE status IN (appointed, completed)',
    updateTime: '2026-01-01T00:00:00Z',
  },
  {
    metricKey: 'followUpRate',
    metricName: '回访完成率',
    definition: '已完成回访数占应回访总数的比例（仅计算已完成咨询的记录）',
    formula: 'COUNT(follow_up_status=completed) / COUNT(status=completed)',
    updateTime: '2026-01-01T00:00:00Z',
  },
]
