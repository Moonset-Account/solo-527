<template>
  <div class="dashboard">
    <n-space vertical :size="24" style="width: 100%">
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="stat in statCards" :key="stat.key">
          <n-card hoverable>
            <div class="stat-card">
              <div class="stat-icon" :style="{ background: stat.color }">
                <span style="font-size: 24px">{{ stat.icon }}</span>
              </div>
              <div class="stat-info">
                <n-statistic :value="stat.value" label-placement="top" :label="stat.label" />
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-grid :cols="2" :x-gap="16">
        <n-grid-item>
          <n-card title="异常提醒" :bordered="false" size="small">
            <template #header-extra>
              <n-tag type="error" size="small">未处理 {{ overdueAlerts.length }} 条</n-tag>
            </template>
            <n-list v-if="overdueAlerts.length > 0" bordered>
              <n-list-item v-for="alert in overdueAlerts" :key="alert.id">
                <template #prefix>
                  <n-tag :type="getAlertLevelType(alert.alert_level)" size="small" round>
                    {{ getStatusText(alert.alert_level) }}
                  </n-tag>
                </template>
                <div class="alert-item">
                  <div class="alert-title">
                    <strong>{{ alert.plot_name }}</strong> - {{ getAlertTypeText(alert.alert_type) }}
                  </div>
                  <div class="alert-desc">{{ alert.message }}</div>
                </div>
                <template #suffix>
                  <n-button size="small" type="primary" quaternary @click="handleAlert(alert.id)">
                    处理
                  </n-button>
                </template>
              </n-list-item>
            </n-list>
            <n-empty v-else description="暂无异常提醒" />
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card title="待办事项" :bordered="false" size="small">
            <template #header-extra>
              <n-tag type="warning" size="small">待完成 {{ pendingTodos.length }} 项</n-tag>
            </template>
            <n-list v-if="pendingTodos.length > 0" bordered>
              <n-list-item v-for="todo in pendingTodos" :key="todo.id">
                <template #prefix>
                  <n-checkbox :checked="todo.is_completed" @update:checked="toggleTodo(todo)" />
                </template>
                <div class="todo-item">
                  <div class="todo-title">{{ todo.title }}</div>
                  <div class="todo-meta">
                    <n-tag :type="getPriorityType(todo.priority)" size="small">
                      {{ getPriorityText(todo.priority) }}
                    </n-tag>
                    <span class="todo-due">{{ formatDateTime(todo.due_time) }} 截止</span>
                  </div>
                </div>
              </n-list-item>
            </n-list>
            <n-empty v-else description="暂无待办事项" />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card title="最近提交记录" :bordered="false" size="small">
        <template #header-extra>
          <n-button size="small" quaternary type="primary" @click="goToRecords">查看全部</n-button>
        </template>
        <n-data-table
          :columns="recordColumns"
          :data="recentRecords"
          :bordered="false"
          :single-line="false"
          size="small"
        />
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { NTag, NButton, useMessage } from 'naive-ui'
import { useApi } from '@/composables/useApi'
import { useFormat } from '@/composables/useFormat'

const router = useRouter()
const message = useMessage()
const { get, put } = useApi()
const { formatDateTime, getStatusText, getAlertTypeText, getRecordTypeText, getStatusTagType } = useFormat()

const stats = ref<any>({})
const overdueAlerts = ref<any[]>([])
const pendingTodos = ref<any[]>([])
const recentRecords = ref<any[]>([])

const statCards = computed(() => [
  { key: 'active_plots', label: '活跃地块', value: stats.value.active_plots_count || 0, icon: '🏠', color: '#e8f5e9' },
  { key: 'growing_batches', label: '生长中批次', value: stats.value.growing_batches_count || 0, icon: '🌱', color: '#fff3e0' },
  { key: 'pending_orders', label: '待分拣订单', value: stats.value.pending_orders_count || 0, icon: '📦', color: '#e3f2fd' },
  { key: 'pending_todos', label: '待办事项', value: stats.value.pending_todos_count || 0, icon: '✅', color: '#fce4ec' },
])

const recordColumns = [
  { title: '记录编号', key: 'record_no', width: 120 },
  { title: '类型', key: 'record_type', width: 100, render: (row: any) => h(NTag, { type: 'info', size: 'small' }, { default: () => getRecordTypeText(row.record_type) }) },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '关联批次', key: 'batch_no', width: 120 },
  { title: '品种', key: 'variety_name', width: 100 },
  { title: '操作人', key: 'operator_name', width: 100 },
  { title: '记录时间', key: 'record_time', width: 160, render: (row: any) => formatDateTime(row.record_time) },
]

function getAlertLevelType(level: string): string {
  if (level === 'danger') return 'error'
  if (level === 'warning') return 'warning'
  return 'info'
}

function getPriorityType(priority: string): string {
  if (priority === 'high') return 'error'
  if (priority === 'medium') return 'warning'
  return 'info'
}

function getPriorityText(priority: string): string {
  if (priority === 'high') return '高'
  if (priority === 'medium') return '中'
  return '低'
}

async function loadStats() {
  try {
    stats.value = await get('/dashboard/stats')
  } catch (e) {
    console.error(e)
  }
}

async function loadOverdueAlerts() {
  try {
    const data: any = await get('/environment/alerts', { is_handled: false, limit: 5 })
    overdueAlerts.value = data
  } catch (e) {
    console.error(e)
  }
}

async function loadPendingTodos() {
  try {
    const data: any = await get('/todos', { is_completed: false, limit: 5 })
    pendingTodos.value = data
  } catch (e) {
    console.error(e)
  }
}

async function loadRecentRecords() {
  try {
    recentRecords.value = await get('/dashboard/recent-records', { limit: 10 })
  } catch (e) {
    console.error(e)
    recentRecords.value = []
  }
}

async function handleAlert(id: number) {
  try {
    await put(`/environment/alerts/${id}`, { is_handled: true })
    message.success('已处理')
    loadOverdueAlerts()
    loadStats()
  } catch (e) {
    message.error('操作失败')
  }
}

async function toggleTodo(todo: any) {
  try {
    await put(`/todos/${todo.id}`, { is_completed: !todo.is_completed })
    message.success(todo.is_completed ? '已完成' : '已取消完成')
    loadPendingTodos()
    loadStats()
  } catch (e) {
    message.error('操作失败')
  }
}

function goToRecords() {
  router.push('/query/farm-records')
}

onMounted(() => {
  loadStats()
  loadOverdueAlerts()
  loadPendingTodos()
  loadRecentRecords()
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.alert-item {
  flex: 1;
  margin-left: 8px;
}

.alert-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 12px;
  color: #999;
}

.todo-item {
  flex: 1;
  margin-left: 8px;
}

.todo-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.todo-due {
  color: #999;
}
</style>
