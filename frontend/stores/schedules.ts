import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export type ShiftType = 'morning' | 'evening' | 'full' | 'rest'

export interface Staff {
  id: string
  name: string
  role: string
  avatarColor: string
}

export interface ScheduleCell {
  staffId: string
  date: string
  shift: ShiftType
  tasks: number
}

export interface LoadWarning {
  id: string
  staffId: string
  staffName: string
  date: string
  type: 'overload' | 'understaff' | 'conflict'
  message: string
  level: 'warning' | 'danger'
}

export interface StaffLoad {
  staffId: string
  staffName: string
  role: string
  loadPercent: number
  totalShifts: number
  totalTasks: number
  avatarColor: string
}

export interface DateLoad {
  date: string
  loadPercent: number
  staffCount: number
  taskCount: number
}

export interface RiskReason {
  reason: string
  count: number
  color: string
}

const shiftTimeMap: Record<ShiftType, { start: string; end: string; label: string }> = {
  morning: { start: '08:00', end: '16:00', label: '早班' },
  evening: { start: '14:00', end: '22:00', label: '晚班' },
  full: { start: '09:00', end: '18:00', label: '全天' },
  rest: { start: '-', end: '-', label: '休息' },
}

export function getShiftInfo(shift: ShiftType) {
  return shiftTimeMap[shift]
}

export function getShiftColor(shift: ShiftType) {
  switch (shift) {
    case 'morning':
      return { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300', hex: '#0EA5E9' }
    case 'evening':
      return { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', hex: '#6366F1' }
    case 'full':
      return { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', hex: '#1A8A7D' }
    case 'rest':
      return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', hex: '#9CA3AF' }
  }
}

export const useSchedulesStore = defineStore('schedules', () => {
  const weekStart = ref(dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'))

  const staffs = ref<Staff[]>([
    { id: 's1', name: '张小明', role: '高级美容师', avatarColor: '#1A8A7D' },
    { id: 's2', name: '李小红', role: '护理师', avatarColor: '#6366F1' },
    { id: 's3', name: '王小刚', role: '寄养专员', avatarColor: '#FF8C42' },
    { id: 's4', name: '赵小芳', role: '前台接待', avatarColor: '#EC4899' },
    { id: 's5', name: '孙小伟', role: '美容师助理', avatarColor: '#8B5CF6' },
    { id: 's6', name: '周小美', role: '资深美容师', avatarColor: '#10B981' },
  ])

  function generateWeekDates(base: string) {
    const dates: string[] = []
    const start = dayjs(base)
    for (let i = 0; i < 7; i++) {
      dates.push(start.add(i, 'day').format('YYYY-MM-DD'))
    }
    return dates
  }

  function generateMonthDates(base: string) {
    const dates: string[] = []
    const start = dayjs(base).startOf('month')
    const end = dayjs(base).endOf('month')
    let current = start
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      dates.push(current.format('YYYY-MM-DD'))
      current = current.add(1, 'day')
    }
    return dates
  }

  function getShiftForDate(staffIndex: number, dayOffset: number): ShiftType {
    const patterns: ShiftType[][] = [
      ['morning', 'morning', 'full', 'full', 'evening', 'rest', 'rest'],
      ['full', 'full', 'morning', 'evening', 'evening', 'rest', 'rest'],
      ['evening', 'evening', 'full', 'morning', 'morning', 'rest', 'rest'],
      ['morning', 'full', 'full', 'full', 'evening', 'rest', 'rest'],
      ['rest', 'morning', 'morning', 'evening', 'full', 'full', 'rest'],
      ['full', 'evening', 'evening', 'morning', 'morning', 'rest', 'rest'],
    ]
    const pattern = patterns[staffIndex % patterns.length]
    const idx = (dayOffset + staffIndex) % 7
    return pattern[idx]
  }

  function getTasksForShift(shift: ShiftType, seed: number) {
    if (shift === 'rest') return 0
    const base = { morning: 4, evening: 3, full: 7 } as const
    const variance = seed % 3
    return base[shift] + variance
  }

  function buildSchedules(dates: string[]) {
    const list: ScheduleCell[] = []
    const startDay = dayjs(dates[0])
    staffs.value.forEach((staff, sIdx) => {
      dates.forEach((date, dIdx) => {
        const dayOffset = dayjs(date).diff(startDay, 'day')
        const shift = getShiftForDate(sIdx, dayOffset)
        const tasks = getTasksForShift(shift, sIdx + dIdx)
        list.push({ staffId: staff.id, date, shift, tasks })
      })
    })
    return list
  }

  const schedules = ref<ScheduleCell[]>(buildSchedules(generateWeekDates(weekStart.value)))

  const loadWarnings = ref<LoadWarning[]>([
    {
      id: 'w1',
      staffId: 's1',
      staffName: '张小明',
      date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      type: 'overload',
      message: '排班任务量达到8个，超过建议阈值7个',
      level: 'danger',
    },
    {
      id: 'w2',
      staffId: 's2',
      staffName: '李小红',
      date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      type: 'understaff',
      message: '晚班仅1人在岗，低于最低2人要求',
      level: 'warning',
    },
    {
      id: 'w3',
      staffId: 's5',
      staffName: '孙小伟',
      date: dayjs().format('YYYY-MM-DD'),
      type: 'conflict',
      message: '与已审批请假单存在时间冲突',
      level: 'danger',
    },
  ])

  const currentView = ref<'week' | 'month'>('week')

  const currentDates = computed(() => {
    return currentView.value === 'week'
      ? generateWeekDates(weekStart.value)
      : generateMonthDates(weekStart.value)
  })

  const dateRangeLabel = computed(() => {
    const dates = currentDates.value
    if (!dates.length) return ''
    const first = dayjs(dates[0])
    const last = dayjs(dates[dates.length - 1])
    if (currentView.value === 'week') {
      return `${first.format('YYYY年MM月DD日')} - ${last.format('MM月DD日')}`
    }
    return first.format('YYYY年MM月')
  })

  function setView(view: 'week' | 'month') {
    currentView.value = view
  }

  function nextPeriod() {
    const base = dayjs(weekStart.value)
    weekStart.value = (currentView.value === 'week'
      ? base.add(1, 'week')
      : base.add(1, 'month')
    ).format('YYYY-MM-DD')
    schedules.value = buildSchedules(currentDates.value)
  }

  function prevPeriod() {
    const base = dayjs(weekStart.value)
    weekStart.value = (currentView.value === 'week'
      ? base.subtract(1, 'week')
      : base.subtract(1, 'month')
    ).format('YYYY-MM-DD')
    schedules.value = buildSchedules(currentDates.value)
  }

  function goToday() {
    weekStart.value = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
    schedules.value = buildSchedules(currentDates.value)
  }

  function updateSchedule(staffId: string, date: string, shift: ShiftType) {
    const cell = schedules.value.find((s) => s.staffId === staffId && s.date === date)
    if (cell) {
      cell.shift = shift
      cell.tasks = shift === 'rest' ? 0 : 5
    }
  }

  function getSchedule(staffId: string, date: string) {
    return schedules.value.find((s) => s.staffId === staffId && s.date === date)
  }

  function getStaffLoads(startDate?: string, endDate?: string): StaffLoad[] {
    const start = startDate ? dayjs(startDate) : dayjs(weekStart.value)
    const end = endDate ? dayjs(endDate) : start.add(6, 'day')
    return staffs.value.map((staff) => {
      const cells = schedules.value.filter((s) => {
        const d = dayjs(s.date)
        return s.staffId === staff.id && (d.isAfter(start, 'day') || d.isSame(start, 'day')) && (d.isBefore(end, 'day') || d.isSame(end, 'day'))
      })
      const totalShifts = cells.filter((c) => c.shift !== 'rest').length
      const totalTasks = cells.reduce((sum, c) => sum + c.tasks, 0)
      const maxShifts = cells.length * 0.85
      const loadPercent = Math.min(100, Math.round((totalShifts / Math.max(1, maxShifts)) * 100))
      return {
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        loadPercent,
        totalShifts,
        totalTasks,
        avatarColor: staff.avatarColor,
      }
    })
  }

  function getDateLoads(startDate?: string, endDate?: string): DateLoad[] {
    const start = startDate ? dayjs(startDate) : dayjs(weekStart.value)
    const end = endDate ? dayjs(endDate) : start.add(6, 'day')
    const result: DateLoad[] = []
    let current = start
    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
      const dateStr = current.format('YYYY-MM-DD')
      const dayCells = schedules.value.filter((s) => s.date === dateStr)
      const staffCount = dayCells.filter((c) => c.shift !== 'rest').length
      const taskCount = dayCells.reduce((sum, c) => sum + c.tasks, 0)
      const maxStaff = staffs.value.length
      const loadPercent = Math.round((staffCount / maxStaff) * 100)
      result.push({ date: dateStr, loadPercent, staffCount, taskCount })
      current = current.add(1, 'day')
    }
    return result
  }

  function getRiskReasons(): RiskReason[] {
    return [
      { reason: '人员不足', count: 12, color: '#EF4444' },
      { reason: '任务超量', count: 8, color: '#F97316' },
      { reason: '健康异常', count: 5, color: '#F59E0B' },
      { reason: '环境问题', count: 3, color: '#8B5CF6' },
      { reason: '时间冲突', count: 6, color: '#3B82F6' },
      { reason: '其他因素', count: 4, color: '#6B7280' },
    ]
  }

  function dismissWarning(id: string) {
    const idx = loadWarnings.value.findIndex((w) => w.id === id)
    if (idx > -1) loadWarnings.value.splice(idx, 1)
  }

  return {
    staffs,
    schedules,
    loadWarnings,
    currentView,
    currentDates,
    dateRangeLabel,
    weekStart,
    setView,
    nextPeriod,
    prevPeriod,
    goToday,
    updateSchedule,
    getSchedule,
    getStaffLoads,
    getDateLoads,
    getRiskReasons,
    dismissWarning,
    generateWeekDates,
    generateMonthDates,
  }
})
