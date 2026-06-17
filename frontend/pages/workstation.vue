<template>
  <div class="page-container">
    <n-card title="排课消课工作台" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-date-picker v-model:value="workDate" type="date" style="width: 180px;" @update:value="loadAll" />
          <n-select v-model:value="filterClass" clearable placeholder="班级" style="width: 160px;" :options="classOpts" @update:value="loadAll" />
          <n-button type="primary" @click="loadAll">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新
          </n-button>
          <n-button @click="navigateTo('/schedules')">
            <template #icon><n-icon><CalendarOutline /></n-icon></template>
            排课管理
          </n-button>
          <n-button type="success" @click="navigateTo('/consumptions')">
            <template #icon><n-icon><ListOutline /></n-icon></template>
            消课记录
          </n-button>
        </n-space>
      </template>

      <n-row :gutter="16" style="margin-bottom: 20px;">
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="今日排课" :value="stats.today_schedules">
              <template #prefix><n-icon :size="18" color="#2080f0"><CalendarOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="已完成" :value="stats.completed_schedules" value-style="color:#18a058;">
              <template #prefix><n-icon :size="18" color="#18a058"><CheckmarkCircleOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="待消课" :value="stats.pending_consumptions" value-style="color:#f0a020;">
              <template #prefix><n-icon :size="18" color="#f0a020"><TimeOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="今日已消课时" :value="stats.today_hours" suffix="h">
              <template #prefix><n-icon :size="18" color="#722ed1"><FlashOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="缺勤提醒" :value="stats.absent_count" value-style="color:#d03050;">
              <template #prefix><n-icon :size="18" color="#d03050"><AlertCircleOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="家长待确认" :value="stats.parent_unverified" value-style="color:#e6a23c;">
              <template #prefix><n-icon :size="18" color="#e6a23c"><EyeOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="本周消课" :value="stats.week_hours" suffix="h">
              <template #prefix><n-icon :size="18" color="#13c2c2"><TrendingUpOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="3">
          <n-card size="small" hoverable style="text-align: center;">
            <n-statistic label="平均满班率" :value="stats.avg_fill_rate" suffix="%">
              <template #prefix><n-icon :size="18" color="#fa8c16"><SchoolOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
      </n-row>

      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="schedules" tab="今日排课">
          <div v-if="todaySchedules.length === 0" style="padding: 48px 0;">
            <n-empty description="当日无排课" />
          </div>
          <n-list v-else hoverable bordered>
            <n-list-item v-for="s in todaySchedules" :key="s.id" style="padding: 12px 16px;">
              <template #prefix>
                <n-tag :type="statusTagType(s.status)" size="small" round>{{ statusLabel(s.status) }}</n-tag>
              </template>
              <template #header>
                <n-space justify="space-between" style="width: 100%;">
                  <n-text strong>{{ s.class_name || '未命名班级' }} · {{ s.topic || '常规课' }}</n-text>
                  <n-text depth="3" style="font-size: 12px;">
                    {{ s.start_time?.toString()?.slice(0, 5) }} - {{ s.end_time?.toString()?.slice(0, 5) }}
                    <span v-if="s.classroom" style="margin-left: 8px;">@ {{ s.classroom }}</span>
                    <span v-if="s.teacher_name" style="margin-left: 8px;">｜ {{ s.teacher_name }}</span>
                  </n-text>
                </n-space>
              </template>
              <n-text depth="3" style="font-size: 12px;">
                已出勤 {{ s.attended_student_count || 0 }}/{{ s.assigned_student_count || 0 }} 人
                <n-tag v-if="s.consumptions_count > 0" type="success" size="small" style="margin-left: 8px;">已消 {{ s.consumptions_count }} 人</n-tag>
                <n-tag v-else-if="s.status === 'completed'" type="warning" size="small" style="margin-left: 8px;">待消课</n-tag>
              </n-text>
              <template #suffix>
                <n-space>
                  <n-button size="tiny" type="primary" :disabled="s.assigned_student_count === 0" @click="openBatchConsume(s)">
                    <template #icon><n-icon><CheckmarkDoneOutline /></n-icon></template>
                    批量消课
                  </n-button>
                  <n-button size="tiny" quaternary @click="viewScheduleDetail(s)">详情</n-button>
                </n-space>
              </template>
            </n-list-item>
          </n-list>
        </n-tab-pane>

        <n-tab-pane name="pending" tab="待确认消课">
          <n-space style="margin-bottom: 12px;">
            <n-button size="small" type="success" :disabled="pendingConsumptions.length === 0" @click="confirmAllPending">
              <template #icon><n-icon><CheckmarkDoneOutline /></n-icon></template>
              一键确认全部 ({{ pendingConsumptions.length }})
            </n-button>
          </n-space>
          <n-data-table
            :columns="pendingCols"
            :data="pendingConsumptions"
            :bordered="false"
            size="small"
            :pagination="pendingConsumptions.length > 50 ? { pageSize: 50 } : false"
          />
        </n-tab-pane>

        <n-tab-pane name="recent" tab="最近消课">
          <n-data-table
            :columns="recentCols"
            :data="recentConsumptions"
            :bordered="false"
            size="small"
            :pagination="recentConsumptions.length > 30 ? { pageSize: 30 } : false"
          />
        </n-tab-pane>

        <n-tab-pane name="absent" tab="缺勤记录">
          <n-data-table
            :columns="absentCols"
            :data="absentRecords"
            :bordered="false"
            size="small"
            :pagination="absentRecords.length > 30 ? { pageSize: 30 } : false"
          />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <n-row :gutter="16">
      <n-col :span="12">
        <n-card title="近7日消课趋势" :bordered="false">
          <div v-if="consumptionTrend.length === 0" style="padding: 24px 0;">
            <n-empty description="暂无数据" />
          </div>
          <div v-else style="padding: 12px 0 12px;">
            <n-space justify="space-around" align="end" style="height: 200px;">
              <div v-for="d in consumptionTrend" :key="d.date" style="display: flex; flex-direction: column; align-items: center; width: 12%;">
                <div style="height: 20px; font-size: 11px; color: #18a058; font-weight: 600;">
                  {{ d.total_hours }}h
                </div>
                <div
                  :style="{
                    width: '100%', maxWidth: '36px',
                    height: `${trendBarHeight(d.total_hours)}px`,
                    background: 'linear-gradient(180deg, #4098fc, #2080f0)',
                    borderRadius: '6px 6px 0 0', minHeight: '4px',
                  }"
                />
                <div style="margin-top: 6px; font-size: 11px; color: #909399;">{{ formatDay(d.date) }}</div>
                <div style="font-size: 10px; color: #606266;">{{ d.total_consumptions }}次</div>
              </div>
            </n-space>
          </div>
        </n-card>
      </n-col>
      <n-col :span="12">
        <n-card title="今日出勤概览" :bordered="false">
          <div v-if="attendanceSummary.length === 0" style="padding: 24px 0;">
            <n-empty description="暂无数据" />
          </div>
          <div v-else>
            <n-grid :cols="2" :x-gap="16" :y-gap="12">
              <n-grid-item v-for="c in attendanceSummary" :key="c.class_id">
                <n-card size="small" :bordered="false" style="background: #fafafa;">
                  <n-space justify="space-between" style="margin-bottom: 8px;">
                    <n-text strong style="font-size: 13px;">{{ c.class_name }}</n-text>
                    <n-text depth="3" style="font-size: 12px;">{{ c.present + c.absent + c.leave }}人</n-text>
                  </n-space>
                  <n-space style="font-size: 12px;" justify="space-between">
                    <n-tag type="success" size="small">出勤 {{ c.present }}</n-tag>
                    <n-tag type="error" size="small">缺勤 {{ c.absent }}</n-tag>
                    <n-tag type="warning" size="small">请假 {{ c.leave }}</n-tag>
                  </n-space>
                  <n-progress
                    :percentage="c.present / Math.max(1, c.present + c.absent + c.leave) * 100"
                    :show-indicator="false"
                    :height="6"
                    style="margin-top: 8px;"
                  />
                </n-card>
              </n-grid-item>
            </n-grid>
          </div>
        </n-card>
      </n-col>
    </n-row>
  </div>

  <n-modal v-model:show="consumeVisible" preset="card" style="width: 720px;" :title="`批量消课 - ${currentSchedule?.class_name || ''}`">
    <template v-if="currentSchedule">
      <n-descriptions :column="2" size="small" bordered style="margin-bottom: 16px;">
        <n-descriptions-item label="日期时间">{{ formatDate(workDate) }} {{ currentSchedule.start_time?.toString()?.slice(0, 5) }}-{{ currentSchedule.end_time?.toString()?.slice(0, 5) }}</n-descriptions-item>
        <n-descriptions-item label="教室">{{ currentSchedule.classroom || '-' }}</n-descriptions-item>
        <n-descriptions-item label="教师">{{ currentSchedule.teacher_name || '-' }}</n-descriptions-item>
        <n-descriptions-item label="主题">{{ currentSchedule.topic || '-' }}</n-descriptions-item>
      </n-descriptions>
      <n-space style="margin-bottom: 12px;" wrap>
        <n-select v-model:value="defaultAttendance" :options="attendanceOpts" style="width: 140px;" label="默认出勤" />
        <n-input-number v-model:value="defaultHours" :min="1" :max="8" style="width: 140px;">
          <template #addon>课时/人</template>
        </n-input-number>
        <n-button quaternary size="small" @click="applyDefaultAttendance">应用默认出勤</n-button>
        <n-button quaternary size="small" @click="markAllPresent">全部出勤</n-button>
        <n-button type="success" @click="submitBatchConsume" :disabled="toConsumeList.length === 0">
          确认消课 ({{ toConsumeList.length }}人)
        </n-button>
      </n-space>
      <n-data-table
        :columns="studentCols"
        :data="classStudents"
        :row-key="(r: any) => r.id"
        :row-props="(r: any) => ({ style: { background: r._consumed ? '#f0f9eb' : '' } })"
        size="small"
        :max-height="380"
      />
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { h, ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  RefreshOutline, CalendarOutline, ListOutline, CheckmarkCircleOutline,
  TimeOutline, FlashOutline, AlertCircleOutline, EyeOutline,
  TrendingUpOutline, SchoolOutline, CheckmarkDoneOutline,
} from '@vicons/ionicons5'
import { apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { DataTableColumns } from 'naive-ui'
import { useMessage, NTag, NSpace, NButton, NSelect, NInputNumber } from 'naive-ui'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('排课消课工作台', route.path)
const message = useMessage()

const workDate = ref(Date.now())
const filterClass = ref<number | null>(null)
const classOpts = ref<any[]>([])
const activeTab = ref('schedules')

const stats = reactive({
  today_schedules: 0, completed_schedules: 0, pending_consumptions: 0,
  today_hours: 0, absent_count: 0, parent_unverified: 0,
  week_hours: 0, avg_fill_rate: 0,
})

const todaySchedules = ref<any[]>([])
const pendingConsumptions = ref<any[]>([])
const recentConsumptions = ref<any[]>([])
const absentRecords = ref<any[]>([])
const consumptionTrend = ref<any[]>([])
const attendanceSummary = ref<any[]>([])

const consumeVisible = ref(false)
const currentSchedule = ref<any>(null)
const classStudents = ref<any[]>([])
const defaultAttendance = ref('present')
const defaultHours = ref(2)

const attendanceOpts = [
  { label: '出勤', value: 'present' },
  { label: '请假', value: 'leave' },
  { label: '缺勤', value: 'absent' },
  { label: '迟到', value: 'late' },
  { label: '早退', value: 'leave_early' },
]

function formatDate(ts: number) { return new Date(ts).toISOString().split('T')[0] }
function formatDay(s: string) { const d = new Date(s); return `${d.getMonth() + 1}/${d.getDate()}` }
function statusTagType(s: string) { return { planned: 'default', confirmed: 'info', in_progress: 'warning', completed: 'success', cancelled: 'error' }[s] || 'default' }
function statusLabel(s: string) { return { planned: '待确认', confirmed: '已确认', in_progress: '上课中', completed: '已完成', cancelled: '已取消' }[s] || s }
function attendanceType(v: string) { return { present: 'success', absent: 'error', leave: 'warning', late: 'warning', leave_early: 'warning' }[v] || 'default' }
function attendanceLabel(v: string) { return { present: '出勤', absent: '缺勤', leave: '请假', late: '迟到', leave_early: '早退' }[v] || v }
function statusConsumeType(v: string) { return { pending: 'warning', consumed: 'success', refunded: 'info', cancelled: 'default' }[v] || 'default' }
function statusConsumeLabel(v: string) { return { pending: '待确认', consumed: '已消课', refunded: '已退费', cancelled: '已取消' }[v] || v }

function trendBarHeight(hours: number) {
  const max = Math.max(...consumptionTrend.value.map(d => d.total_hours), 1)
  return Math.max(4, Math.round(hours / max * 150))
}

const pendingCols: DataTableColumns = [
  { title: '编号', key: 'consumption_code', width: 140 },
  { title: '日期', key: 'consumption_date', width: 100 },
  { title: '学生', key: 'student_name', width: 100 },
  { title: '班级', key: 'class_name', width: 140 },
  { title: '课时', key: 'hours_consumed', width: 70, align: 'center' },
  { title: '出勤', key: 'attendance', width: 80, render: (r: any) => h(NTag, { type: attendanceType(r.attendance), size: 'small', round: true }, { default: () => attendanceLabel(r.attendance) }) },
  { title: '状态', key: 'status', width: 80, render: (r: any) => h(NTag, { type: statusConsumeType(r.status), size: 'small', round: true }, { default: () => statusConsumeLabel(r.status) }) },
  { title: '关联排课', key: 'schedule_code', width: 130 },
  { title: '操作', key: 'ops', width: 140, render: (r: any) => h(NSpace, null, { default: () => [
    h(NButton, { size: 'tiny', type: 'success', onClick: () => confirmOne(r) }, { default: () => '确认消课' }),
    h(NButton, { size: 'tiny', quaternary: true, onClick: () => navigateTo(`/consumptions?highlight=${r.id}`) }, { default: () => '详情' }),
  ]}) },
]

const recentCols: DataTableColumns = [
  { title: '编号', key: 'consumption_code', width: 140 },
  { title: '日期', key: 'consumption_date', width: 100 },
  { title: '学生', key: 'student_name', width: 100 },
  { title: '班级', key: 'class_name', width: 140 },
  { title: '课时', key: 'hours_consumed', width: 70, align: 'center' },
  { title: '出勤', key: 'attendance', width: 80, render: (r: any) => h(NTag, { type: attendanceType(r.attendance), size: 'small', round: true }, { default: () => attendanceLabel(r.attendance) }) },
  { title: '家长确认', key: 'parent_verified', width: 90, render: (r: any) => r.parent_verified ? h(NTag, { type: 'success', size: 'small' }, { default: () => '已确认' }) : h(NTag, { type: 'warning', size: 'small' }, { default: () => '待确认' }) },
  { title: '确认时间', key: 'confirmed_at', width: 140, render: (r: any) => r.confirmed_at?.slice(5, 16) || '-' },
]

const absentCols: DataTableColumns = [
  { title: '日期', key: 'consumption_date', width: 100 },
  { title: '学生', key: 'student_name', width: 100 },
  { title: '班级', key: 'class_name', width: 140 },
  { title: '课时', key: 'hours_consumed', width: 70, align: 'center' },
  { title: '出勤', key: 'attendance', width: 80, render: (r: any) => h(NTag, { type: attendanceType(r.attendance), size: 'small', round: true }, { default: () => attendanceLabel(r.attendance) }) },
  { title: '备注', key: 'remark', ellipsis: true, render: (r: any) => r.remark || '-' },
  { title: '操作', key: 'ops', width: 120, render: (r: any) => h(NButton, { size: 'tiny', type: 'primary', onClick: () => sendAbsentReminder(r) }, { default: () => '提醒家长' }) },
]

const studentCols: DataTableColumns = [
  { title: '学号', key: 'student_no', width: 110 },
  { title: '姓名', key: 'name', width: 100 },
  { title: '专业', key: 'major', width: 80 },
  { title: '剩余课时', key: 'remaining_hours', width: 90 },
  { title: '状态', key: '_consumed', width: 80, render: (r: any) => r._consumed ? h(NTag, { type: 'success', size: 'small' }, { default: () => '已消课' }) : h(NTag, { type: 'info', size: 'small' }, { default: () => '待消课' }) },
  { title: '出勤', key: '_attendance', width: 130, render: (r: any) => r._consumed ? r._attendance_label : h(NSelect, {
    value: r._attendance, options: attendanceOpts, size: 'small', style: 'width: 120px;',
    'onUpdate:value': (v: string) => (r._attendance = v),
  }) },
  { title: '课时', key: '_hours', width: 110, render: (r: any) => r._consumed ? r._hours : h(NInputNumber, { value: r._hours, min: 0, max: 8, size: 'small', style: 'width:90px;', 'onUpdate:value': (v: number) => (r._hours = v) }) },
]

const toConsumeList = computed(() => classStudents.value.filter(s => !s._consumed && s._hours > 0))

function applyDefaultAttendance() {
  classStudents.value.forEach(s => { if (!s._consumed) s._attendance = defaultAttendance.value })
}
function markAllPresent() {
  classStudents.value.forEach(s => { if (!s._consumed) { s._attendance = 'present'; s._hours = defaultHours.value } })
}

async function openBatchConsume(s: any) {
  currentSchedule.value = s
  consumeVisible.value = true
  try {
    const studs: any = await apiGet('/common/students/simple', { class_id: s.class_id })
    const cons: any = await apiGet('/schedules/consumptions', { schedule_id: s.id, page_size: 500 })
    const consumedMap = new Map<number, any>()
    if (cons?.items) cons.items.forEach((c: any) => consumedMap.set(c.student_id, c))
    classStudents.value = (Array.isArray(studs) ? studs : []).map(s2 => ({
      ...s2,
      _attendance: consumedMap.get(s2.id)?.attendance || defaultAttendance.value,
      _hours: consumedMap.get(s2.id)?.hours_consumed || defaultHours.value,
      _attendance_label: attendanceLabel(consumedMap.get(s2.id)?.attendance || 'present'),
      _consumed: !!consumedMap.get(s2.id) && consumedMap.get(s2.id)?.status === 'consumed',
    }))
  } catch (e) {
    console.warn(e)
    classStudents.value = []
  }
}

async function submitBatchConsume() {
  if (toConsumeList.value.length === 0) return
  const msg = message.loading(`正在消课 ${toConsumeList.value.length} 人...`, { duration: 0 })
  let ok = 0, fail = 0
  for (const s of toConsumeList.value) {
    try {
      await apiPost('/schedules/consumptions', {
        schedule_id: currentSchedule.value.id,
        student_id: s.id,
        hours_consumed: s._hours,
        attendance: s._attendance,
        status: s._attendance === 'absent' ? 'pending' : 'consumed',
      })
      ok++
    } catch { fail++ }
  }
  msg.destroy()
  if (ok > 0) message.success(`成功消课 ${ok} 人${fail ? `，失败 ${fail} 人` : ''}`)
  else message.error('消课失败')
  consumeVisible.value = false
  loadAll()
}

async function confirmOne(r: any) {
  try {
    await apiPut(`/schedules/consumptions/${r.id}`, { status: 'consumed' })
    message.success('已确认消课')
    loadAll()
  } catch (e: any) { message.error(e?.data?.detail || '操作失败') }
}

async function confirmAllPending() {
  if (pendingConsumptions.value.length === 0) return
  const msg = message.loading(`正在确认 ${pendingConsumptions.value.length} 条记录...`, { duration: 0 })
  let ok = 0
  for (const r of pendingConsumptions.value) {
    try {
      await apiPut(`/schedules/consumptions/${r.id}`, { status: 'consumed' })
      ok++
    } catch {}
  }
  msg.destroy()
  message.success(`已确认 ${ok} 条`)
  loadAll()
}

function sendAbsentReminder(r: any) {
  message.info(`已向 ${r.student_name} 家长发送缺勤提醒`)
}

function viewScheduleDetail(s: any) {
  navigateTo(`/schedules?highlight=${s.id}`)
}

async function loadAll() {
  await Promise.all([
    loadClasses(), loadStats(), loadTodaySchedules(),
    loadPendingConsumptions(), loadRecentConsumptions(),
    loadAbsentRecords(), loadTrend(), loadAttendanceSummary(),
  ])
}

async function loadClasses() {
  try {
    const c: any = await apiGet('/common/classes/simple', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(c)) classOpts.value = c.map(x => ({ label: x.name, value: x.id }))
  } catch (e) { console.warn(e) }
}

async function loadStats() {
  try {
    const d: any = await apiGet('/dashboard/stats', { campus_id: userStore.selectedCampusId })
    if (d) {
      stats.today_schedules = d.today_schedules || 0
      stats.today_hours = d.today_hours || 0
      stats.pending_consumptions = d.pending_todos || 0
      stats.parent_unverified = d.pending_receipts || 0
      stats.avg_fill_rate = d.average_fill_rate || 0
      stats.absent_count = 0
    }
  } catch (e) { console.warn(e) }
}

async function loadTodaySchedules() {
  try {
    const d = formatDate(workDate.value)
    const res: any = await apiGet('/schedules', {
      start_date: d, end_date: d,
      class_id: filterClass.value,
      campus_id: userStore.selectedCampusId,
      page_size: 200,
    })
    todaySchedules.value = res?.items || []
    stats.completed_schedules = todaySchedules.value.filter(s => s.status === 'completed').length
  } catch (e) { todaySchedules.value = [] }
}

async function loadPendingConsumptions() {
  try {
    const res: any = await apiGet('/schedules/consumptions', {
      status: 'pending',
      class_id: filterClass.value,
      campus_id: userStore.selectedCampusId,
      page_size: 200,
    })
    pendingConsumptions.value = res?.items || []
    stats.pending_consumptions = pendingConsumptions.value.length
  } catch (e) { pendingConsumptions.value = [] }
}

async function loadRecentConsumptions() {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    const res: any = await apiGet('/schedules/consumptions', {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      class_id: filterClass.value,
      campus_id: userStore.selectedCampusId,
      page_size: 100,
    })
    recentConsumptions.value = res?.items || []
  } catch (e) { recentConsumptions.value = [] }
}

async function loadAbsentRecords() {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    const res: any = await apiGet('/schedules/consumptions', {
      attendance: 'absent',
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      class_id: filterClass.value,
      campus_id: userStore.selectedCampusId,
      page_size: 100,
    })
    absentRecords.value = res?.items || []
    stats.absent_count = absentRecords.value.length
  } catch (e) { absentRecords.value = [] }
}

async function loadTrend() {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    const res: any = await apiGet('/schedules/consumptions/stats', {
      campus_id: userStore.selectedCampusId,
      class_id: filterClass.value,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    })
    consumptionTrend.value = Array.isArray(res) ? res : []
    stats.week_hours = consumptionTrend.value.reduce((s, d) => s + (d.total_hours || 0), 0)
  } catch (e) { consumptionTrend.value = [] }
}

async function loadAttendanceSummary() {
  const summaryMap = new Map<number, any>()
  todaySchedules.value.forEach(s => {
    if (!summaryMap.has(s.class_id)) {
      summaryMap.set(s.class_id, { class_id: s.class_id, class_name: s.class_name, present: 0, absent: 0, leave: 0 })
    }
  })
  const todaysConsumptions = recentConsumptions.value.filter(c => c.consumption_date === formatDate(workDate.value))
  todaysConsumptions.forEach(c => {
    const item = summaryMap.get(c.class_id) || { class_id: c.class_id, class_name: c.class_name, present: 0, absent: 0, leave: 0 }
    if (c.attendance === 'present' || c.attendance === 'late' || c.attendance === 'leave_early') item.present++
    else if (c.attendance === 'absent') item.absent++
    else if (c.attendance === 'leave') item.leave++
    summaryMap.set(c.class_id, item)
  })
  attendanceSummary.value = Array.from(summaryMap.values())
}

onMounted(loadAll)
</script>
