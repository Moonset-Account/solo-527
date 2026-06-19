<template>
  <div>
    <PageHeader title="首页仪表盘" subtitle="查看今日运营数据概览" />
    <a-row :gutter="[16, 16]">
      <a-col :xs="12" :md="6">
        <a-card class="stat-card" @click="goToPage('/followup/tasks')">
          <div class="stat-icon green">
            <PhoneOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayFollowups }}</div>
            <div class="stat-label">今日待回访</div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card class="stat-card" @click="goToPage('/leads/assign')">
          <div class="stat-icon orange">
            <UserOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingLeads }}</div>
            <div class="stat-label">待分配线索</div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card class="stat-card" @click="goToPage('/quality/status')">
          <div class="stat-icon red">
            <WarningOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingExceptions }}</div>
            <div class="stat-label">待处理异常</div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card class="stat-card" @click="goToPage('/reception/inspection')">
          <div class="stat-icon primary">
            <CalendarOutlined />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayAppointments }}</div>
            <div class="stat-label">今日预约</div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="mt-4">
      <a-col :xs="24" :lg="12">
        <a-card title="今日待办" class="list-card">
          <a-table
            :columns="todoColumns"
            :data-source="todoList"
            :pagination="false"
            :loading="loading"
            row-key="id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'title'">
                <a class="todo-title" @click="goToPage(record.redirectUrl)">
                  {{ record.title }}
                </a>
              </template>
              <template v-else-if="column.key === 'time'">
                <span class="text-gray-500">{{ record.time }}</span>
              </template>
              <template v-else-if="column.key === 'priority'">
                <a-tag :color="getPriorityColor(record.priority)">
                  {{ getPriorityText(record.priority) }}
                </a-tag>
              </template>
            </template>
          </a-table>
          <Empty v-if="!loading && todoList.length === 0" description="今日暂无待办" />
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="12">
        <a-card title="异常记录" class="list-card">
          <a-table
            :columns="exceptionColumns"
            :data-source="exceptionList"
            :pagination="false"
            :loading="loading"
            row-key="id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="getLevelColor(record.level)">
                  {{ getLevelText(record.level) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openCloseModal(record)">
                  关闭
                </a-button>
              </template>
            </template>
          </a-table>
          <Empty v-if="!loading && exceptionList.length === 0" description="暂无异常记录" />
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="closeModalVisible"
      title="关闭异常"
      @ok="handleCloseException"
      :confirm-loading="closing"
      ok-text="确认关闭"
      cancel-text="取消"
    >
      <a-form :model="closeForm" layout="vertical">
        <a-form-item
          label="关闭原因"
          name="solution"
          :rules="[{ required: true, message: '请输入关闭原因' }]"
        >
          <a-textarea
            v-model:value="closeForm.solution"
            placeholder="请输入关闭原因"
            :rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import {
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import Empty from '@/components/Empty.vue'
import { getDashboardData } from '@/api/dashboard'
import { closeException } from '@/api/exceptions'
import type { DashboardTodoItem, ExceptionRecord } from '@/types'

const router = useRouter()

const loading = ref(false)
const closing = ref(false)
const closeModalVisible = ref(false)
const selectedException = ref<ExceptionRecord | null>(null)

const stats = reactive({
  todayFollowups: 0,
  pendingLeads: 0,
  pendingExceptions: 0,
  todayAppointments: 0,
})

const todoList = ref<DashboardTodoItem[]>([])
const exceptionList = ref<ExceptionRecord[]>([])

const closeForm = reactive({
  solution: '',
})

const todoColumns: TableColumnsType = [
  { title: '任务', dataIndex: 'title', key: 'title' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '时间', dataIndex: 'time', key: 'time', width: 100 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
]

const exceptionColumns: TableColumnsType = [
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '上报人', dataIndex: 'reporter', key: 'reporter', width: 80 },
  { title: '操作', key: 'action', width: 60 },
]

const fetchData = async () => {
  try {
    loading.value = true
    const data = await getDashboardData()
    stats.todayFollowups = data.todayFollowups
    stats.pendingLeads = data.pendingLeads
    stats.pendingExceptions = data.pendingExceptions
    stats.todayAppointments = data.todayAppointments
    todoList.value = data.todoList || []
    exceptionList.value = (data.exceptionList || []).sort((a, b) => {
      const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return levelOrder[a.level] - levelOrder[b.level]
    })
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const goToPage = (url: string) => {
  router.push(url)
}

const getPriorityColor = (priority?: string) => {
  const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' }
  return colors[priority || 'low']
}

const getPriorityText = (priority?: string) => {
  const texts: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return texts[priority || 'low']
}

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'blue' }
  return colors[level] || 'blue'
}

const getLevelText = (level: string) => {
  const texts: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低' }
  return texts[level] || '低'
}

const openCloseModal = (record: ExceptionRecord) => {
  selectedException.value = record
  closeForm.solution = ''
  closeModalVisible.value = true
}

const handleCloseException = async () => {
  if (!selectedException.value || !closeForm.solution.trim()) {
    message.warning('请输入关闭原因')
    return
  }
  try {
    closing.value = true
    await closeException(selectedException.value.id, { solution: closeForm.solution })
    message.success('异常已关闭')
    closeModalVisible.value = false
    await fetchData()
  } catch (error) {
    console.error('Failed to close exception:', error)
  } finally {
    closing.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-bottom: 12px;
}

.stat-icon.primary {
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #00b42a 0%, #52c41a 100%);
}

.stat-icon.red {
  background: linear-gradient(135deg, #f53f3f 0%, #ff7875 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 4px;
}

.list-card {
  height: 100%;
}

.todo-title {
  color: #165dff;
  cursor: pointer;
}

.todo-title:hover {
  text-decoration: underline;
}

.mt-4 {
  margin-top: 16px;
}

.text-gray-500 {
  color: #8c8c8c;
}
</style>
