<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>签到记录</span>
        <n-select
          v-model:value="filterStatus"
          placeholder="状态筛选"
          :options="statusOptions"
          style="width: 140px"
          clearable
          @update:value="loadRecords"
        />
      </div>
    </template>

    <n-data-table
      :columns="columns"
      :data="records"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useMessage, NTag } from 'naive-ui'
import api from '~/utils/api'
import { checkInStatusLabels, formatDateTime } from '~/utils/dict'
import type { CheckInRecord } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const records = ref<CheckInRecord[]>([])
const loading = ref(false)
const filterStatus = ref<string | null>(null)

const statusOptions = Object.entries(checkInStatusLabels).map(([value, label]) => ({ label, value }))

const statusTypeMap: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  checked_in: 'success',
  late: 'warning',
  not_checked: 'default',
  early: 'info',
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '面试ID', key: 'interview_id', width: 100 },
  { title: '候选人ID', key: 'candidate_id', width: 100 },
  {
    title: '签到时间',
    key: 'check_in_time',
    render(row: any) {
      return formatDateTime(row.check_in_time)
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row: any) {
      return h(NTag, { type: statusTypeMap[row.status] }, () => checkInStatusLabels[row.status])
    },
  },
  { title: '签到方式', key: 'check_in_method' },
  { title: '地点', key: 'location' },
  {
    title: '创建时间',
    key: 'created_at',
    render(row: any) {
      return formatDateTime(row.created_at)
    },
  },
]

async function loadRecords() {
  loading.value = true
  try {
    const res = await api.get('/admin/check-ins', {
      params: { status: filterStatus.value || undefined },
    })
    records.value = res.data
  } catch (e) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
