<template>
  <div class="page-container">
    <div class="card-section">
      <n-grid :cols="4" responsive="screen" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-card hoverable>
            <template #header>
              <n-space justify="space-between" align="center">
                <n-text style="font-size: 13px; color: #909399;">今日排课</n-text>
                <n-icon size="18" style="color: #2080f0;"><CalendarOutline /></n-icon>
              </n-space>
            </template>
            <n-statistic label="节" :value="stats.today_schedules">
              <template #prefix>
                <n-number-animation :from="0" :to="stats.today_schedules" :active="true" />
              </template>
            </n-statistic>
            <n-text depth="3" style="font-size: 12px;">
              <n-tag type="success" round size="small" style="margin-right: 4px;">上课</n-tag>
              点击查看 <router-link to="/schedules" style="color: #2080f0;">排课管理 →</router-link>
            </n-text>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <template #header>
              <n-space justify="space-between" align="center">
                <n-text style="font-size: 13px; color: #909399;">今日消课</n-text>
                <n-icon size="18" style="color: #18a058;"><CheckmarkCircleOutline /></n-icon>
              </n-space>
            </template>
            <n-space align="baseline">
              <n-statistic label="人次" :value="stats.today_consumptions" />
              <n-statistic label="课时" :value="stats.today_hours" style="margin-left: 20px;" />
            </n-space>
            <n-text depth="3" style="font-size: 12px;">
              人均 {{ stats.today_consumptions ? (stats.today_hours / stats.today_consumptions).toFixed(1) : 0 }} 课时
              <router-link to="/consumptions" style="color: #18a058; margin-left: 8px;">查看明细 →</router-link>
            </n-text>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <template #header>
              <n-space justify="space-between" align="center">
                <n-text style="font-size: 13px; color: #909399;">待办事项</n-text>
                <n-badge :value="stats.overdue_reminders" color="#d03050" :show-zero="false">
                  <n-icon size="18" style="color: #f0a020;"><AlertCircleOutline /></n-icon>
                </n-badge>
              </n-space>
            </template>
            <n-space align="baseline">
              <n-statistic label="进行中" :value="stats.pending_todos" style="color: #f0a020;" />
              <n-statistic label="已逾期" :value="stats.overdue_reminders" style="margin-left: 20px;">
                <template #value>
                  <n-text type="error">{{ stats.overdue_reminders }}</n-text>
                </template>
              </n-statistic>
            </n-space>
            <n-text depth="3" style="font-size: 12px;">
              含 {{ stats.homework_unsubmitted }} 条作业未交 / {{ stats.pending_receipts }} 条待签回执
            </n-text>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <template #header>
              <n-space justify="space-between" align="center">
                <n-text style="font-size: 13px; color: #909399;">校区概况</n-text>
                <n-icon size="18" style="color: #722ed1;"><BarChartOutline /></n-icon>
              </n-space>
            </template>
            <n-space align="baseline">
              <n-statistic label="班级" :value="stats.total_classes" />
              <n-statistic label="学生" :value="stats.active_students" style="margin-left: 16px;" />
            </n-space>
            <n-text depth="3" style="font-size: 12px;">
              平均满班率
              <n-tag :type="stats.average_fill_rate >= 80 ? 'success' : stats.average_fill_rate >= 60 ? 'warning' : 'error'" round size="small" style="margin-left: 4px;">
                {{ stats.average_fill_rate.toFixed(1) }}%
              </n-tag>
              <router-link to="/operations/fill-rate" style="color: #722ed1; margin-left: 6px;">报表 →</router-link>
            </n-text>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <n-grid :cols="3" responsive="screen" :x-gap="16" :y-gap="16">
      <n-grid-item :span="2">
        <n-card title="待办事项" :bordered="false">
          <template #header-extra>
            <n-space>
              <n-tag type="info" round size="small">{{ todos.length }} 条</n-tag>
              <n-button size="small" quaternary @click="refreshAll">
                <template #icon><n-icon><RefreshOutline /></n-icon></template>
                刷新
              </n-button>
            </n-space>
          </template>
          <div v-if="todos.length === 0" style="padding: 40px 0;">
            <n-empty description="暂无待办，休息一下吧！" />
          </div>
          <n-list v-else hoverable clickable bordered>
            <n-list-item v-for="todo in todos.slice(0, 15)" :key="`${todo.type}-${todo.id}`" @click="handleTodoClick(todo)">
              <template #prefix>
                <n-tag :type="todoPriorityType(todo.priority)" size="small" round>
                  {{ priorityLabel(todo.priority) }}
                </n-tag>
              </template>
              <template #header>
                <n-space justify="space-between" style="width: 100%;">
                  <n-text strong style="font-size: 13px;">{{ todo.title }}</n-text>
                  <n-text v-if="todo.deadline" :type="isOverdue(todo.deadline) ? 'error' : 'depth-3'" style="font-size: 11px;">
                    {{ formatDeadline(todo.deadline) }}
                  </n-text>
                </n-space>
              </template>
              <n-text depth="3" style="font-size: 12px;">{{ todo.description }}</n-text>
              <template #suffix>
                <n-icon size="16" style="color: #909399;"><ChevronForwardOutline /></n-icon>
              </template>
            </n-list-item>
          </n-list>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card title="逾期提醒" :bordered="false">
          <template #header-extra>
            <n-badge :value="overdues.length" color="#d03050" />
          </template>
          <div v-if="overdues.length === 0" style="padding: 40px 0;">
            <n-empty description="无逾期提醒" />
          </div>
          <n-timeline v-else>
            <n-timeline-item
              v-for="item in overdues.slice(0, 10)"
              :key="`o-${item.id}`"
              :type="overdueType(item.type)"
              :title="item.title"
              :time="formatOverdueTime(item.overdue_time)"
            >
              <n-text depth="3" style="font-size: 12px;">{{ item.description }}</n-text>
              <n-tag v-if="item.student_name" size="small" round type="info" style="margin-top: 4px;">
                {{ item.student_name }}
              </n-tag>
            </n-timeline-item>
          </n-timeline>
        </n-card>
      </n-grid-item>
    </n-grid>

    <div style="margin-top: 16px;">
      <n-card title="最近作业提交" :bordered="false">
        <template #header-extra>
          <n-space>
            <router-link to="/feedbacks" style="color: #2080f0; font-size: 13px;">全部反馈 →</router-link>
          </n-space>
        </template>
        <n-data-table
          :columns="submissionCols"
          :data="submissions"
          :bordered="false"
          :single-line="false"
          size="medium"
          :pagination="submissions.length > 10 ? { pageSize: 10 } : false"
          empty="暂无最近提交"
        />
      </n-card>
    </div>

    <div style="margin-top: 16px;">
      <n-grid :cols="2" responsive="screen" :x-gap="16">
        <n-grid-item>
          <n-card title="班级满班率 TOP" :bordered="false">
            <div v-if="fillRates.length === 0" style="padding: 20px 0;">
              <n-empty description="暂无数据" />
            </div>
            <div v-else>
              <div
                v-for="(c, i) in sortedFillRates"
                :key="c.class_id"
                style="margin-bottom: 14px;"
              >
                <n-space justify="space-between" style="margin-bottom: 4px;">
                  <n-space>
                    <n-tag :type="i < 3 ? 'success' : 'default'" round size="small">TOP {{ i + 1 }}</n-tag>
                    <n-text strong style="font-size: 13px;">{{ c.class_name }}</n-text>
                  </n-space>
                  <n-space>
                    <n-text depth="3" style="font-size: 12px;">{{ c.current_students }}/{{ c.max_students }}人</n-text>
                    <n-tag :type="c.fill_rate >= 90 ? 'success' : c.fill_rate >= 70 ? 'info' : c.fill_rate >= 50 ? 'warning' : 'error'" round size="small">
                      {{ c.fill_rate.toFixed(1) }}%
                    </n-tag>
                  </n-space>
                </n-space>
                <n-progress
                  type="line"
                  :percentage="c.fill_rate"
                  :show-indicator="false"
                  :color="c.fill_rate >= 90 ? '#18a058' : c.fill_rate >= 70 ? '#2080f0' : c.fill_rate >= 50 ? '#f0a020' : '#d03050'"
                  :height="8"
                />
              </div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="近7日消课趋势" :bordered="false">
            <div v-if="consumptionStats.length === 0" style="padding: 20px 0;">
              <n-empty description="暂无数据" />
            </div>
            <div v-else style="padding: 12px 0 24px;">
              <n-space justify="space-around" align="end" style="height: 180px;">
                <div
                  v-for="d in consumptionStats"
                  :key="d.date"
                  style="display: flex; flex-direction: column; align-items: center; width: 12%;"
                >
                  <div style="height: 20px; font-size: 11px; color: #18a058; font-weight: 600;">
                    {{ d.total_hours }}h
                  </div>
                  <div
                    :style="{
                      width: '100%',
                      maxWidth: '40px',
                      height: `${barHeight(d.total_hours)}px`,
                      background: 'linear-gradient(180deg, #4098fc, #2080f0)',
                      borderRadius: '6px 6px 0 0',
                      minHeight: '4px',
                    }"
                  />
                  <div style="margin-top: 6px; font-size: 11px; color: #909399;">
                    {{ formatDay(d.date) }}
                  </div>
                  <div style="font-size: 10px; color: #606266;">
                    {{ d.total_consumptions }}次
                  </div>
                </div>
              </n-space>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import type {
  DashboardStats, TodoItem, OverdueItem, RecentSubmission,
  ScheduleFillRate, ConsumptionStats,
} from '~/types'
import {
  CalendarOutline, CheckmarkCircleOutline, AlertCircleOutline,
  BarChartOutline, RefreshOutline, ChevronForwardOutline,
} from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { apiGet } from '~/composables/useApi'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const message = useMessage()

appStore.setPage('首页看板', route.path)

const stats = ref<DashboardStats>({
  today_schedules: 0, today_consumptions: 0, today_hours: 0,
  pending_todos: 0, overdue_reminders: 0, recent_submissions: 0,
  homework_unsubmitted: 0, pending_receipts: 0,
  total_students: 0, active_students: 0, total_classes: 0, average_fill_rate: 0,
})
const todos = ref<TodoItem[]>([])
const overdues = ref<OverdueItem[]>([])
const submissions = ref<RecentSubmission[]>([])
const fillRates = ref<ScheduleFillRate[]>([])
const consumptionStats = ref<ConsumptionStats[]>([])

const sortedFillRates = computed(() =>
  [...fillRates.value].sort((a, b) => b.fill_rate - a.fill_rate).slice(0, 6)
)

const submissionCols: DataTableColumns<RecentSubmission> = [
  { title: '类型', key: 'type', width: 100, render: (row) => h('span', row.type === 'homework_graded' ? '已批改' : '已提交') },
  { title: '作业/作品', key: 'title', ellipsis: true },
  { title: '学生', key: 'student_name', width: 100 },
  { title: '班级', key: 'class_name', width: 180 },
  { title: '分数', key: 'score', width: 80, render: (row) => row.score !== null && row.score !== undefined ? h('strong', { style: 'color:#18a058;' }, row.score) : '-' },
  { title: '提交时间', key: 'submit_time', width: 160, render: (row) => new Date(row.submit_time).toLocaleString('zh-CN') },
  {
    title: '状态', key: 'status', width: 100, render: (row) => {
      const map: Record<string, any> = {
        submitted: { t: 'success', v: '已提交' },
        graded: { t: 'info', v: '已批改' },
        late: { t: 'warning', v: '迟交' },
      }
      const m = map[row.status] || { t: 'default', v: row.status }
      return h('n-tag', { type: m.t, round: true, size: 'small' }, { default: () => m.v })
    },
  },
]

function barHeight(hours: number) {
  const max = Math.max(...consumptionStats.value.map(d => d.total_hours), 1)
  return Math.max(4, Math.round(hours / max * 140))
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDeadline(s?: string) {
  if (!s) return ''
  const d = new Date(s)
  const diff = d.getTime() - Date.now()
  const hours = Math.round(diff / 3600000)
  if (hours < 0) return `已逾期${Math.abs(hours)}h`
  if (hours < 24) return `${hours}小时后`
  return `${Math.round(hours / 24)}天后`
}

function formatOverdueTime(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function priorityLabel(p: string) {
  return { urgent: '紧急', high: '高', normal: '普通', low: '低' }[p] || p
}

function todoPriorityType(p: string) {
  return { urgent: 'error', high: 'warning', normal: 'info', low: 'default' }[p] as any || 'default'
}

function isOverdue(s?: string) {
  if (!s) return false
  return new Date(s).getTime() < Date.now()
}

function overdueType(t: string) {
  const map: Record<string, any> = {
    homework: 'error', homework_overdue: 'error',
    receipt_overdue: 'warning', schedule: 'info',
  }
  return map[t] || 'default'
}

function handleTodoClick(todo: TodoItem) {
  if (todo.entity_type === 'course_schedule') {
    navigateTo('/schedules')
  } else if (todo.entity_type === 'course_consumption') {
    navigateTo('/consumptions')
  } else if (todo.entity_type === 'homework_submission') {
    navigateTo('/homeworks')
  } else {
    message.info(todo.title)
  }
}

async function refreshAll() {
  await Promise.all([
    loadStats(), loadTodos(), loadOverdues(), loadSubmissions(), loadFillRates(), loadConsumptionStats(),
  ])
  message.success('数据已刷新')
}

async function loadStats() {
  try {
    const d: any = await apiGet('/dashboard/stats', { campus_id: userStore.selectedCampusId })
    if (d) stats.value = d
  } catch (e) {
    console.warn('load stats fallback, using mock data')
  }
}

async function loadTodos() {
  try {
    const d: any = await apiGet('/dashboard/todos', { campus_id: userStore.selectedCampusId, limit: 30 })
    if (Array.isArray(d)) todos.value = d
  } catch (e) {
    console.warn(e)
  }
}

async function loadOverdues() {
  try {
    const d: any = await apiGet('/dashboard/overdue', { campus_id: userStore.selectedCampusId, limit: 20 })
    if (Array.isArray(d)) overdues.value = d
  } catch (e) {
    console.warn(e)
  }
}

async function loadSubmissions() {
  try {
    const d: any = await apiGet('/dashboard/recent-submissions', { campus_id: userStore.selectedCampusId, days: 7, limit: 30 })
    if (Array.isArray(d)) submissions.value = d
  } catch (e) {
    console.warn(e)
  }
}

async function loadFillRates() {
  try {
    const d: any = await apiGet('/schedules/fill-rates', { campus_id: userStore.selectedCampusId })
    if (Array.isArray(d)) fillRates.value = d
  } catch (e) {
    console.warn(e)
  }
}

async function loadConsumptionStats() {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    const d: any = await apiGet('/schedules/consumptions/stats', {
      campus_id: userStore.selectedCampusId,
      start_date: fmt(start), end_date: fmt(end),
    })
    if (Array.isArray(d)) consumptionStats.value = d
  } catch (e) {
    console.warn(e)
  }
}

onMounted(refreshAll)
</script>
