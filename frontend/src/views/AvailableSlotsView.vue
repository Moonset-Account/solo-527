<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">可约时段</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#909399">查看日历式的时段占用与剩余容量</p>
      </div>
      <div style="display:flex;gap:10px">
        <el-select v-model="selectedStaff" placeholder="全部人员" clearable style="width:160px" @change="loadCalendar">
          <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="String(s.id)" />
        </el-select>
        <el-button @click="prevWeek"><el-icon><ArrowLeft /></el-icon> 上一周</el-button>
        <el-button @click="nextWeek">下一周 <el-icon><ArrowRight /></el-icon></el-button>
        <el-button type="primary" @click="goToday">今天</el-button>
      </div>
    </div>

    <div class="calendar-wrap section-card">
      <div class="cal-header">
        <div class="cal-title">{{ weekRangeText }}</div>
        <div class="cal-legend">
          <div class="legend-item"><span class="dot ok"></span>可约</div>
          <div class="legend-item"><span class="dot warn"></span>紧张</div>
          <div class="legend-item"><span class="dot danger"></span>已满</div>
          <div class="legend-item"><span class="dot off"></span>休息</div>
        </div>
      </div>

      <div v-loading="loading" class="cal-body">
        <div class="cal-staff-col">
          <div class="cal-cell cal-staff-title">人员 / 日期</div>
          <div v-for="s in calendarStaff" :key="'staff-' + s.id" class="cal-cell cal-staff-cell">
            <el-avatar :size="28" style="background:#e6f7f3;color:#2ab99f;font-size:12px;margin-right:8px">
              {{ s.name?.[0] }}
            </el-avatar>
            <div>
              <div style="font-weight:500;font-size:13px">{{ s.name }}</div>
              <div style="font-size:10px;color:#909399">{{ s.title || (s.type === 'doctor' ? '医生' : '技师') }}</div>
            </div>
          </div>
        </div>

        <div class="cal-days-scroll">
          <div class="cal-days-row">
            <div
              v-for="d in dateHeaders"
              :key="d.date"
              :class="['cal-cell', 'cal-day-header', { today: d.isToday, weekend: d.isWeekend }]"
            >
              <div class="day-week">{{ d.weekText }}</div>
              <div class="day-date" :class="{ active: d.isToday }">{{ d.dateText }}</div>
              <div class="day-stats">{{ getDayStats(d.date) }}</div>
            </div>
          </div>

          <div v-for="s in calendarStaff" :key="'row-' + s.id" class="cal-day-row">
            <div
              v-for="d in dateHeaders"
              :key="`${s.id}-${d.date}`"
              class="cal-cell cal-slot-cell"
            >
              <div class="slot-group">
                <div v-if="getSlots(s.id, d.date).length === 0" class="slot-empty">休息 / 未排</div>
                <div
                  v-for="slot in getSlots(s.id, d.date)"
                  :key="slot.id"
                  :class="['slot-chip', slotStatus(slot), { selected: selectedSlot?.id === slot.id }]"
                  @click="selectSlot(slot, s, d)"
                >
                  <span class="slot-t">{{ slot.start_time }}-{{ slot.end_time }}</span>
                  <span class="slot-c">{{ slot.capacity - slot.booked_count }}/{{ slot.capacity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showSlotDetail" title="时段详情" width="520px">
      <div v-if="selectedSlot" style="padding:10px 0">
        <el-descriptions :column="2" border size="default">
          <el-descriptions-item label="日期">{{ selectedDay?.dateText }}</el-descriptions-item>
          <el-descriptions-item label="时段">{{ selectedSlot.start_time }} - {{ selectedSlot.end_time }}</el-descriptions-item>
          <el-descriptions-item label="人员">{{ selectedStaffInfo?.name }}</el-descriptions-item>
          <el-descriptions-item label="服务">{{ serviceName(selectedSlot.service_id) }}</el-descriptions-item>
          <el-descriptions-item label="容量">{{ selectedSlot.capacity }}</el-descriptions-item>
          <el-descriptions-item label="已约">
            <el-tag :type="selectedSlot.booked_count >= selectedSlot.capacity ? 'danger' : (selectedSlot.booked_count / selectedSlot.capacity >= 0.7 ? 'warning' : 'success')" size="small">
              {{ selectedSlot.booked_count }} 人
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="剩余名额" :span="2">
            <span style="font-size:22px;font-weight:700;color:#2ab99f">{{ selectedSlot.capacity - selectedSlot.booked_count }}</span>
            <span style="color:#909399;margin-left:6px">个</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showSlotDetail = false">关闭</el-button>
        <el-button type="primary" :disabled="!canBook(selectedSlot)" @click="bookSlot">
          <el-icon><Plus /></el-icon> 为此时段创建预约
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Plus } from '@element-plus/icons-vue'
import { getTimeSlotCalendar } from '@/api/timeslot'
import { getStaffList } from '@/api/staff'
import { getServiceList } from '@/api/service'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

const router = useRouter()

const loading = ref(false)
const staffList = ref<any[]>([])
const serviceList = ref<any[]>([])
const calendarData = ref<Record<string, any[]>>({})
const calendarStaff = ref<any[]>([])
const weekStart = ref(dayjs().startOf('week'))
const selectedStaff = ref('')
const showSlotDetail = ref(false)
const selectedSlot = ref<any>(null)
const selectedStaffInfo = ref<any>(null)
const selectedDay = ref<any>(null)

const weekRangeText = computed(() => {
  const start = weekStart.value
  const end = start.add(6, 'day')
  return `${start.format('YYYY年MM月DD日')} - ${end.format('MM月DD日')}`
})

const dateHeaders = computed(() => {
  const arr: any[] = []
  for (let i = 0; i < 7; i++) {
    const d = weekStart.value.add(i, 'day')
    arr.push({
      date: d.format('YYYY-MM-DD'),
      dateText: d.format('MM/DD'),
      weekText: d.format('dddd'),
      isToday: d.isSame(dayjs(), 'day'),
      isWeekend: d.day() === 0 || d.day() === 6
    })
  }
  return arr
})

const getSlots = (staffId: number, date: string) => {
  return (calendarData.value[date] || []).filter((s: any) => s.staff_id === staffId)
}

const getDayStats = (date: string) => {
  const slots = calendarData.value[date] || []
  const total = slots.length
  if (!total) return '-'
  const totalCap = slots.reduce((sum, s) => sum + s.capacity, 0)
  const totalBook = slots.reduce((sum, s) => sum + s.booked_count, 0)
  const free = totalCap - totalBook
  return `${free}空/${totalCap}`
}

const slotStatus = (slot: any) => {
  const ratio = slot.booked_count / slot.capacity
  if (slot.booked_count >= slot.capacity) return 'full'
  if (ratio >= 0.7) return 'warn'
  return 'ok'
}
const canBook = (slot: any) => slot.booked_count < slot.capacity

const serviceName = (id: number) => {
  const s = serviceList.value.find(x => x.id === id)
  return s?.name || `服务#${id}`
}

const loadCalendar = async () => {
  loading.value = true
  try {
    const res = await getTimeSlotCalendar({
      startDate: weekStart.value.format('YYYY-MM-DD'),
      endDate: weekStart.value.add(6, 'day').format('YYYY-MM-DD'),
    })
    calendarData.value = res.data?.byDate || {}
    const list = (res.data?.staffList || staffList.value).filter((s: any) =>
      !selectedStaff.value || String(s.id) === selectedStaff.value
    )
    calendarStaff.value = list.length > 0 ? list : staffList.value.filter(s => !selectedStaff.value || String(s.id) === selectedStaff.value)
  } finally {
    loading.value = false
  }
}

const selectSlot = (slot: any, staff: any, day: any) => {
  selectedSlot.value = slot
  selectedStaffInfo.value = staff
  selectedDay.value = day
  showSlotDetail.value = true
}

const bookSlot = () => {
  sessionStorage.setItem('quick_book_slot', JSON.stringify({
    staffId: selectedStaffInfo.value.id,
    timeSlotId: selectedSlot.value.id,
    serviceId: selectedSlot.value.service_id,
    bookingDate: selectedDay.value.date,
    startTime: selectedSlot.value.start_time,
    endTime: selectedSlot.value.end_time,
    amount: serviceList.value.find(s => s.id === selectedSlot.value.service_id)?.price || 0
  }))
  showSlotDetail.value = false
  router.push('/bookings/create')
}

const prevWeek = () => { weekStart.value = weekStart.value.subtract(7, 'day'); loadCalendar() }
const nextWeek = () => { weekStart.value = weekStart.value.add(7, 'day'); loadCalendar() }
const goToday = () => { weekStart.value = dayjs().startOf('week'); loadCalendar() }

onMounted(async () => {
  const [stRes, svRes] = await Promise.all([getStaffList({ active: '1' }), getServiceList({ active: '1' })])
  staffList.value = stRes.data
  calendarStaff.value = stRes.data
  serviceList.value = svRes.data
  await loadCalendar()
})

watch(selectedStaff, () => loadCalendar())
</script>

<style scoped>
.calendar-wrap { padding: 0; overflow: hidden; }
.cal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.cal-title { font-size: 16px; font-weight: 600; color: #303133; }
.cal-legend { display: flex; gap: 16px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #606266; }
.legend-item .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.legend-item .dot.ok { background: #67c23a; }
.legend-item .dot.warn { background: #e6a23c; }
.legend-item .dot.danger { background: #f56c6c; }
.legend-item .dot.off { background: #e4e7ed; }

.cal-body {
  display: flex;
  overflow: hidden;
}
.cal-staff-col {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
}
.cal-days-scroll {
  flex: 1;
  overflow-x: auto;
}

.cal-cell {
  min-height: 44px;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px;
  display: flex;
  align-items: center;
}
.cal-staff-title {
  height: 90px;
  background: #f7f9fa;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #606266;
  font-size: 13px;
  justify-content: center;
}
.cal-staff-cell {
  height: 100px;
  background: #fff;
}

.cal-days-row, .cal-day-row {
  display: flex;
}
.cal-day-header {
  width: 180px;
  height: 90px;
  flex-shrink: 0;
  background: #f7f9fa;
  border-right: 1px solid #f0f0f0;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.cal-day-header.weekend { background: #fef5f0; }
.cal-day-header.today { background: #e6f7f3; }
.day-week { font-size: 12px; color: #909399; }
.day-date { font-size: 18px; font-weight: 600; color: #303133; }
.day-date.active { background: #2ab99f; color: #fff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.day-stats { font-size: 11px; color: #2ab99f; font-weight: 500; }

.cal-slot-cell {
  width: 180px;
  height: 100px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  align-items: flex-start;
  padding: 8px;
}
.slot-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.slot-empty {
  font-size: 11px;
  color: #c0c4cc;
  text-align: center;
  padding: 20px 0;
}
.slot-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
}
.slot-chip.ok { background: #f0f9eb; color: #67c23a; border-color: #e1f3d8; }
.slot-chip.warn { background: #fdf6ec; color: #e6a23c; border-color: #faecd8; }
.slot-chip.full { background: #fef0f0; color: #f56c6c; border-color: #fde2e2; opacity: 0.7; cursor: not-allowed; }
.slot-chip:hover:not(.full) { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.slot-chip.selected { outline: 2px solid #2ab99f; outline-offset: 1px; }
.slot-t { font-weight: 600; }
.slot-c { font-family: monospace; }
</style>
