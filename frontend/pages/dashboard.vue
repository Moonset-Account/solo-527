<template>
  <n-card :bordered="false">
    <template #header>
      <div class="card-header">
        <span>数据看板</span>
      </div>
    </template>
    <n-grid :cols="4" :x-gap="16">
      <n-grid-item v-for="stat in stats" :key="stat.key">
        <n-card>
          <div class="stat-card">
            <n-icon :size="28" :color="stat.color">
              <component :is="stat.icon" />
            </n-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-card>

  <n-card :bordered="false" style="margin-top: 20px">
    <template #header>投递状态分布</template>
    <n-space :size="12" wrap>
      <n-tag
        v-for="item in statusList"
        :key="item.key"
        :type="item.type"
        size="large"
      >
        {{ item.label }}: {{ item.count }}
      </n-tag>
    </n-space>
  </n-card>

  <n-grid :cols="2" :x-gap="20" style="margin-top: 20px">
    <n-grid-item>
      <n-card :bordered="false" title="最近待办">
        <n-list bordered>
          <n-list-item v-for="todo in recentTodos" :key="todo.id">
            <n-thing :title="todo.title" :description="formatDateTime(todo.created_at)">
              <template #extra>
                <n-tag :type="priorityColors[todo.priority] as any" size="small">
                  {{ priorityLabels[todo.priority] }}
                </n-tag>
              </template>
            </n-thing>
          </n-list-item>
          <n-list-item v-if="recentTodos.length === 0">
            <span style="color: #999">暂无待办</span>
          </n-list-item>
        </n-list>
      </n-card>
    </n-grid-item>
    <n-grid-item>
      <n-card :bordered="false" title="今日面试">
        <n-list bordered>
          <n-list-item v-for="interview in todayInterviews" :key="interview.id">
            <n-thing :title="interview.title" :description="interview.start_time">
              <template #extra>
                <n-tag size="small">
                  {{ interviewTypeLabels[interview.interview_type] }}
                </n-tag>
              </template>
            </n-thing>
          </n-list-item>
          <n-list-item v-if="todayInterviews.length === 0">
            <span style="color: #999">今日无面试安排</span>
          </n-list-item>
        </n-list>
      </n-card>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  TeamOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@vicons/antd'
import api from '~/utils/api'
import { formatDateTime, priorityLabels, priorityColors, interviewTypeLabels } from '~/utils/dict'
import type { Todo, Interview } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const statsData = ref<any>(null)
const recentTodos = ref<Todo[]>([])
const todayInterviews = ref<Interview[]>([])

const stats = computed(() => [
  { key: 'candidates', label: '候选人总数', value: statsData.value?.total_candidates || 0, icon: UserOutlined, color: '#18a058' },
  { key: 'positions', label: '在招职位', value: statsData.value?.total_positions || 0, icon: FileTextOutlined, color: '#2080f0' },
  { key: 'applications', label: '投递总数', value: statsData.value?.total_applications || 0, icon: TeamOutlined, color: '#f0a020' },
  { key: 'interviews', label: '待面试', value: statsData.value?.pending_interviews || 0, icon: CalendarOutlined, color: '#d03050' },
])

const statusList = computed(() => {
  const counts = statsData.value?.status_counts || {}
  const statusMap: Record<string, { label: string; type: string }> = {
    submitted: { label: '已投递', type: 'default' },
    screening: { label: '筛选中', type: 'info' },
    screening_passed: { label: '筛选通过', type: 'success' },
    assessment: { label: '测评中', type: 'warning' },
    interview: { label: '面试中', type: 'warning' },
    offer: { label: 'Offer中', type: 'success' },
    rejected: { label: '已拒绝', type: 'error' },
  }
  return Object.entries(statusMap).map(([key, val]) => ({
    key,
    label: val.label,
    type: val.type,
    count: counts[key] || 0,
  }))
})

async function loadStats() {
  try {
    const res = await api.get('/admin/stats/summary')
    statsData.value = res.data
  } catch (e) {
    // ignore
  }
}

async function loadTodos() {
  try {
    const res = await api.get('/todos/my/normal', { params: { limit: 5 } })
    recentTodos.value = res.data
  } catch (e) {
    // ignore
  }
}

async function loadInterviews() {
  try {
    const res = await api.get('/interviews', { params: { limit: 5 } })
    todayInterviews.value = res.data?.slice(0, 5) || []
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadStats()
  loadTodos()
  loadInterviews()
})
</script>

<style scoped>
.card-header {
  font-size: 16px;
  font-weight: 600;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-info {
  flex: 1;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
}
.stat-label {
  color: #999;
  font-size: 13px;
  margin-top: 4px;
}
</style>
