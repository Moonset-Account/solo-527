<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>投递管理</span>
        <div class="filters">
          <n-select
            v-model:value="filterStatus"
            placeholder="状态筛选"
            :options="statusOptions"
            style="width: 140px"
            clearable
            @update:value="loadApplications"
          />
          <n-select
            v-model:value="filterStage"
            placeholder="阶段筛选"
            :options="stageOptions"
            style="width: 140px"
            clearable
            @update:value="loadApplications"
          />
          <n-input
            v-model:value="keyword"
            placeholder="搜索"
            clearable
            style="width: 200px"
            @keyup.enter="loadApplications"
          >
            <template #prefix>
              <n-icon><SearchOutlined /></n-icon>
            </template>
          </n-input>
        </div>
      </div>
    </template>

    <n-data-table
      :columns="columns"
      :data="applications"
      :pagination="false"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />

    <n-pagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :item-count="total"
      show-size-picker
      style="margin-top: 16px; justify-content: flex-end"
      @update:page="loadApplications"
      @update:page-size="loadApplications"
    />
  </n-card>

  <n-modal v-model:show="showDetail" preset="card" :style="{ width: '700px' }" :title="'投递详情 - ' + (currentApp?.candidate?.name || '')">
    <n-descriptions v-if="currentApp" bordered :column="2">
      <n-descriptions-item label="候选人">
        {{ currentApp.candidate?.name || '-' }}
      </n-descriptions-item>
      <n-descriptions-item label="职位">
        {{ currentApp.position?.title || '-' }}
      </n-descriptions-item>
      <n-descriptions-item label="状态">
        <n-tag :type="statusColors[currentApp.status] as any">
          {{ statusLabels[currentApp.status] }}
        </n-tag>
      </n-descriptions-item>
      <n-descriptions-item label="当前阶段">
        {{ stageLabels[currentApp.current_stage] }}
      </n-descriptions-item>
      <n-descriptions-item label="投递渠道">
        {{ currentApp.source_channel || '-' }}
      </n-descriptions-item>
      <n-descriptions-item label="投递时间">
        {{ formatDateTime(currentApp.applied_at) }}
      </n-descriptions-item>
    </n-descriptions>

    <n-divider>状态流转记录</n-divider>
    <n-timeline>
      <n-timeline-item
        v-for="h in statusHistory"
        :key="h.id"
        :type="getStatusTimelineType(h.to_status)"
        :title="statusLabels[h.to_status]"
        :time="formatDateTime(h.changed_at)"
      >
        {{ h.change_reason || '状态变更' }}
        <template v-if="h.cycle_days != null">
          <br />
          <span style="color: #999; font-size: 12px">周期: {{ h.cycle_days }}天</span>
        </template>
      </n-timeline-item>
    </n-timeline>

    <template #footer>
      <n-space justify="end">
        <n-select
          v-model:value="newStatus"
          placeholder="变更状态"
          :options="statusOptions"
          style="width: 160px"
        />
        <n-button type="primary" @click="changeStatus">更新状态</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { SearchOutlined } from '@vicons/antd'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import {
  statusLabels, statusColors, stageLabels, formatDateTime,
} from '~/utils/dict'
import type { Application, StatusHistory } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const applications = ref<Application[]>([])
const loading = ref(false)
const keyword = ref('')
const filterStatus = ref<string | null>(null)
const filterStage = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showDetail = ref(false)
const currentApp = ref<Application | null>(null)
const statusHistory = ref<StatusHistory[]>([])
const newStatus = ref<string | null>(null)

const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ label, value }))
const stageOptions = Object.entries(stageLabels).map(([value, label]) => ({ label, value }))

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '候选人',
    key: 'candidate',
    render(row: any) {
      return h('span', row.candidate?.name || '-')
    },
  },
  {
    title: '职位',
    key: 'position',
    render(row: any) {
      return h('span', row.position?.title || '-')
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row: any) {
      return h('n-tag', { type: statusColors[row.status] }, () => statusLabels[row.status])
    },
  },
  {
    title: '阶段',
    key: 'current_stage',
    render(row: any) {
      return stageLabels[row.current_stage] || '-'
    },
  },
  { title: '投递渠道', key: 'source_channel' },
  {
    title: '投递时间',
    key: 'applied_at',
    render(row: any) {
      return formatDateTime(row.applied_at)
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: any) {
      return h('n-button', { size: 'small', onClick: () => viewDetail(row.id) }, () => '查看')
    },
  },
]

function getStatusTimelineType(status: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  const map: Record<string, any> = {
    submitted: 'default',
    screening: 'info',
    screening_passed: 'success',
    assessment: 'warning',
    assessment_passed: 'success',
    interview: 'warning',
    interview_passed: 'success',
    offer: 'success',
    offer_accepted: 'success',
    rejected: 'error',
    cancelled: 'default',
  }
  return map[status] || 'default'
}

async function loadApplications() {
  loading.value = true
  try {
    const res = await api.get('/applications', {
      params: {
        status: filterStatus.value || undefined,
        stage: filterStage.value || undefined,
        keyword: keyword.value || undefined,
        skip: (page.value - 1) * pageSize.value,
        limit: pageSize.value,
      },
    })
    applications.value = res.data
  } catch (e) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function viewDetail(id: number) {
  try {
    const [appRes, historyRes] = await Promise.all([
      api.get(`/applications/${id}`),
      api.get(`/applications/${id}/history`),
    ])
    currentApp.value = appRes.data
    statusHistory.value = historyRes.data
    showDetail.value = true
    newStatus.value = null
  } catch (e) {
    message.error('加载详情失败')
  }
}

async function changeStatus() {
  if (!newStatus.value || !currentApp.value) return
  try {
    await api.post(`/applications/${currentApp.value.id}/status`, {
      to_status: newStatus.value,
      change_reason: '手动更新状态',
    })
    message.success('状态更新成功')
    loadApplications()
    viewDetail(currentApp.value.id)
  } catch (err: any) {
    message.error(err.response?.data?.detail || '更新失败')
  }
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filters {
  display: flex;
  gap: 8px;
}
</style>
