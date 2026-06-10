<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">技师排班</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#909399">管理医生与技师的排班和休息</p>
      </div>
      <div style="display:flex;gap:10px">
        <el-select v-model="viewMode" style="width:120px">
          <el-option label="周视图" value="week" />
          <el-option label="日视图" value="day" />
        </el-select>
        <el-button @click="prevPeriod"><el-icon><ArrowLeft /></el-icon> 上{{ viewMode === 'week' ? '一周' : '一天' }}</el-button>
        <el-button @click="nextPeriod">下{{ viewMode === 'week' ? '一周' : '一天' }} <el-icon><ArrowRight /></el-icon></el-button>
        <el-button type="primary" @click="goToday">今天</el-button>
        <el-button type="success" @click="showAdd = true"><el-icon><Plus /></el-icon> 新增排班</el-button>
        <el-button type="warning" @click="showBulkAdd = true"><el-icon><Setting /></el-icon> 批量排时段</el-button>
      </div>
    </div>

    <div class="section-card">
      <div class="card-body" v-loading="loading">
        <div class="sched-wrap">
          <div class="sched-staff-col">
            <div class="sched-header sched-cell">人员 / 日期</div>
            <div v-for="s in staffList" :key="'staff-' + s.id" class="sched-staff-cell sched-cell">
              <div class="staff-avatar" :style="{ background: colorByType(s.type) }">{{ s.name?.[0] }}</div>
              <div style="flex:1">
                <div class="staff-name">{{ s.name }}</div>
                <div class="staff-role">
                  <el-tag :type="s.type === 'doctor' ? 'primary' : 'success'" size="small" effect="light">
                    {{ s.type === 'doctor' ? '医生' : '技师' }}
                  </el-tag>
                  <span style="margin-left:4px">{{ s.title || '' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="sched-days-scroll">
            <div class="sched-days-row">
              <div
                v-for="d in days"
                :key="d.date"
                :class="['sched-header', 'sched-cell', 'sched-day-cell', { today: d.isToday, weekend: d.isWeekend }]"
              >
                <div class="d-week">{{ d.weekText }}</div>
                <div class="d-date" :class="{ active: d.isToday }">{{ d.dateText }}</div>
                <div style="margin-top:6px">
                  <el-button link size="small" type="primary" @click="quickAdd(d)">
                    <el-icon><Plus /></el-icon> 排班
                  </el-button>
                </div>
              </div>
            </div>
            <div v-for="s in staffList" :key="'row-' + s.id" class="sched-row">
              <div v-for="d in days" :key="`${s.id}-${d.date}`" class="sched-day-cell sched-cell">
                <div v-if="getSchedule(s.id, d.date) === 'off'" class="day-off-tag">
                  <el-icon><Sunny /></el-icon> 休息
                </div>
                <div v-else-if="getSchedules(s.id, d.date).length === 0" class="no-sched">
                  <el-button link size="small" type="primary" @click="openScheduleModal(s, d)">
                    <el-icon><EditPen /></el-icon> 设置
                  </el-button>
                </div>
                <template v-else>
                  <div
                    v-for="sch in getSchedules(s.id, d.date)"
                    :key="sch.id"
                    class="schedule-chip"
                    @click="openScheduleModal(s, d, sch)"
                  >
                    <div class="time">{{ sch.start_time }} - {{ sch.end_time }}</div>
                    <div v-if="sch.note" class="note">{{ sch.note }}</div>
                    <div class="actions">
                      <el-button link size="small" type="danger" @click.stop="deleteSched(sch)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showAdd" title="新增排班" width="500px">
      <el-form :model="addForm" label-width="90px">
        <el-form-item label="选择人员">
          <el-select v-model="addForm.staffId" placeholder="请选择" style="width:100%">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排班日期">
          <el-date-picker v-model="addForm.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="是否休息">
          <el-switch v-model="addForm.isDayOff" />
        </el-form-item>
        <template v-if="!addForm.isDayOff">
          <el-form-item label="上班时间">
            <el-time-picker v-model="addForm.startTime" value-format="HH:mm" placeholder="选择上班时间" style="width:100%" />
          </el-form-item>
          <el-form-item label="下班时间">
            <el-time-picker v-model="addForm.endTime" value-format="HH:mm" placeholder="选择下班时间" style="width:100%" />
          </el-form-item>
        </template>
        <el-form-item label="备注">
          <el-input v-model="addForm.note" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBulkAdd" title="批量排时段" width="560px">
      <el-alert
        title="批量生成时段功能说明：根据设定的日期范围和间隔，自动为所选人员创建可预约时段"
        type="info" show-icon :closable="false" style="margin-bottom:20px"
      />
      <el-form :model="bulkForm" label-width="100px">
        <el-form-item label="选择人员">
          <el-select v-model="bulkForm.staffIds" multiple placeholder="可多选" style="width:100%">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联服务">
          <el-select v-model="bulkForm.serviceId" placeholder="选择服务项目" style="width:100%">
            <el-option v-for="sv in services" :key="sv.id" :label="sv.name" :value="sv.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="bulkForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="每日时段">
          <el-time-picker v-model="bulkForm.startTime" value-format="HH:mm" placeholder="开始" />
          <span style="margin:0 8px">至</span>
          <el-time-picker v-model="bulkForm.endTime" value-format="HH:mm" placeholder="结束" />
        </el-form-item>
        <el-form-item label="时段间隔">
          <el-select v-model="bulkForm.interval" style="width:160px">
            <el-option label="30 分钟" :value="30" />
            <el-option label="45 分钟" :value="45" />
            <el-option label="60 分钟" :value="60" />
            <el-option label="90 分钟" :value="90" />
          </el-select>
        </el-form-item>
        <el-form-item label="时段容量">
          <el-input-number v-model="bulkForm.capacity" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBulkAdd = false">取消</el-button>
        <el-button type="primary" :loading="bulkSubmitting" @click="submitBulkAdd">批量生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, ArrowRight, Plus, Sunny, EditPen, Delete, Setting
} from '@element-plus/icons-vue'
import { getStaffList, addStaffSchedule, deleteStaffSchedule } from '@/api/staff'
import { getServiceList } from '@/api/service'
import { bulkCreateTimeSlots } from '@/api/timeslot'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

const loading = ref(false)
const submitting = ref(false)
const bulkSubmitting = ref(false)
const staffList = ref<any[]>([])
const services = ref<any[]>([])
const schedulesMap = ref<Record<string, any[]>>({})
const viewMode = ref('week')
const cursor = ref(dayjs())
const showAdd = ref(false)
const showBulkAdd = ref(false)

const addForm = reactive({
  staffId: null as number | null,
  date: '',
  isDayOff: false,
  startTime: '09:00',
  endTime: '18:00',
  note: '',
})

const bulkForm = reactive({
  staffIds: [] as number[],
  serviceId: null as number | null,
  dateRange: [] as string[],
  startTime: '09:00',
  endTime: '18:00',
  interval: 30,
  capacity: 1,
})

const days = computed(() => {
  const count = viewMode.value === 'week' ? 7 : 1
  const arr: any[] = []
  const start = viewMode.value === 'week' ? cursor.value.startOf('week') : cursor.value
  for (let i = 0; i < count; i++) {
    const d = start.add(i, 'day')
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

const colorByType = (t: string) => t === 'doctor' ? '#6c7ae0' : '#2ab99f'

const scheduleKey = (sid: number, date: string) => `${sid}_${date}`

const getSchedules = (sid: number, date: string) => {
  return (schedulesMap.value[scheduleKey(sid, date)] || []).filter(s => !s.is_day_off)
}

const getSchedule = (sid: number, date: string) => {
  const list = schedulesMap.value[scheduleKey(sid, date)] || []
  return list.find(s => s.is_day_off) ? 'off' : null
}

const loadData = async () => {
  loading.value = true
  try {
    const sRes = await getStaffList({ active: '1' })
    staffList.value = sRes.data
    const svRes = await getServiceList({ active: '1' })
    services.value = svRes.data

    const all: Record<string, any[]> = {}
    const dates = days.value.map(d => d.date)
    for (const s of staffList.value) {
      try {
        const res = await fetch(`/api/staff/${s.id}/schedules?startDate=${dates[0]}&endDate=${dates[dates.length-1]}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('qinghe_token') || ''}` }
        })
        if (res.ok) {
          const data = (await res.json()).data || []
          for (const sch of data) {
            const k = scheduleKey(s.id, sch.schedule_date)
            if (!all[k]) all[k] = []
            all[k].push(sch)
          }
        }
      } catch (_) { /* ignore */ }
    }
    schedulesMap.value = all
  } finally {
    loading.value = false
  }
}

const openScheduleModal = (staff: any, d: any, sch?: any) => {
  addForm.staffId = staff.id
  addForm.date = d.date
  if (sch) {
    addForm.isDayOff = !!sch.is_day_off
    addForm.startTime = sch.start_time
    addForm.endTime = sch.end_time
    addForm.note = sch.note || ''
  }
  showAdd.value = true
}
const quickAdd = (d: any) => {
  addForm.date = d.date
  addForm.staffId = null
  addForm.isDayOff = false
  showAdd.value = true
}

const submitAdd = async () => {
  if (!addForm.staffId) { ElMessage.warning('请选择人员'); return }
  if (!addForm.date) { ElMessage.warning('请选择日期'); return }
  submitting.value = true
  try {
    await addStaffSchedule(addForm.staffId, {
      scheduleDate: addForm.date,
      startTime: addForm.startTime,
      endTime: addForm.endTime,
      isDayOff: addForm.isDayOff,
      note: addForm.note
    })
    ElMessage.success('排班创建成功')
    showAdd.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

const submitBulkAdd = async () => {
  if (!bulkForm.staffIds.length) { ElMessage.warning('请选择至少一个人员'); return }
  if (!bulkForm.serviceId) { ElMessage.warning('请选择服务项目'); return }
  if (!bulkForm.dateRange?.length) { ElMessage.warning('请选择日期范围'); return }
  bulkSubmitting.value = true
  try {
    const res = await bulkCreateTimeSlots({
      staffIds: bulkForm.staffIds,
      serviceId: bulkForm.serviceId,
      startDate: bulkForm.dateRange[0],
      endDate: bulkForm.dateRange[1],
      startTime: bulkForm.startTime,
      endTime: bulkForm.endTime,
      interval: bulkForm.interval,
      capacity: bulkForm.capacity,
    })
    ElMessage.success(res.message || `已批量生成时段`)
    showBulkAdd.value = false
  } finally {
    bulkSubmitting.value = false
  }
}

const deleteSched = async (sch: any) => {
  await ElMessageBox.confirm('确认删除此排班吗？', '提示', { type: 'warning' })
  await deleteStaffSchedule(sch.id)
  ElMessage.success('已删除')
  loadData()
}

const prevPeriod = () => {
  cursor.value = viewMode.value === 'week' ? cursor.value.subtract(7, 'day') : cursor.value.subtract(1, 'day')
  loadData()
}
const nextPeriod = () => {
  cursor.value = viewMode.value === 'week' ? cursor.value.add(7, 'day') : cursor.value.add(1, 'day')
  loadData()
}
const goToday = () => {
  cursor.value = dayjs()
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.sched-wrap { display: flex; overflow: hidden; border: 1px solid #f0f0f0; border-radius: 8px; }
.sched-staff-col { width: 200px; flex-shrink: 0; border-right: 1px solid #f0f0f0; }
.sched-days-scroll { flex: 1; overflow-x: auto; }
.sched-cell { padding: 12px; min-height: 86px; border-bottom: 1px solid #f0f0f0; }
.sched-header {
  background: #f7f9fa;
  min-height: 110px;
  font-weight: 600;
  color: #606266;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.sched-staff-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 120px;
  background: #fff;
}
.staff-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600;
}
.staff-name { font-weight: 500; color: #303133; font-size: 14px; }
.staff-role { margin-top: 4px; font-size: 12px; color: #909399; display: flex; align-items: center; }

.sched-days-row, .sched-row { display: flex; }
.sched-day-cell {
  width: 160px;
  min-width: 160px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
}
.sched-day-cell.today { background: #f0faf7; }
.sched-day-cell.weekend { background: #fef9f5; }
.d-week { font-size: 12px; color: #909399; }
.d-date { font-size: 20px; font-weight: 600; color: #303133; }
.d-date.active {
  background: #2ab99f; color: #fff;
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  margin-top: 4px;
}

.day-off-tag {
  background: #f0f2f5;
  color: #909399;
  border-radius: 6px;
  padding: 20px 0;
  text-align: center;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.no-sched {
  min-height: 60px;
  display: flex; align-items: center; justify-content: center;
}
.schedule-chip {
  background: linear-gradient(135deg, #e6f7f3, #f0faf7);
  border: 1px solid #b7e4d8;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  position: relative;
  cursor: pointer;
  margin-bottom: 6px;
  transition: all 0.15s;
}
.schedule-chip:hover { box-shadow: 0 2px 8px rgba(42,185,159,0.2); }
.schedule-chip .time { font-weight: 600; color: #1f9580; }
.schedule-chip .note { font-size: 11px; color: #606266; margin-top: 2px; }
.schedule-chip .actions { position: absolute; right: 4px; top: 4px; display: none; }
.schedule-chip:hover .actions { display: block; }
</style>
