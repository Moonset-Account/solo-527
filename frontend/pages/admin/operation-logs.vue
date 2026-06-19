<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">操作日志</h2>
      
      <div class="table-toolbar">
        <div class="search-bar">
          <n-select
            v-model:value="filterType"
            :options="typeOptions"
            placeholder="操作类型"
            style="width: 140px"
            clearable
          />
          <n-input
            v-model:value="filterTarget"
            placeholder="目标类型"
            style="width: 140px"
            clearable
          />
        </div>
      </div>
      
      <n-data-table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        @update:page="handlePageChange"
      >
        <template #type="{ row }">
          <n-tag :type="typeTagType(row.operation_type)">
            {{ typeLabel(row.operation_type) }}
          </n-tag>
        </template>
      </n-data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard, NInput, NSelect, NDataTable, NTag, useMessage
} from 'naive-ui'
import { useApi } from '~/composables/useApi'

const message = useMessage()
const api = useApi()

const loading = ref(false)
const data = ref<any[]>([])
const filterType = ref<string | null>(null)
const filterTarget = ref('')
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const typeOptions = [
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '签到', value: 'checkin' },
  { label: '退款', value: 'refund' },
  { label: '质量变更', value: 'quality_change' },
  { label: '状态变更', value: 'status_change' },
  { label: '导出', value: 'export' },
]

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '操作类型', key: 'type', width: 120 },
  { title: '操作人', key: 'operator_name', width: 100 },
  { title: '报名ID', key: 'registration_id', width: 80 },
  { title: '目标类型', key: 'target_type', width: 120 },
  { title: '目标ID', key: 'target_id', width: 80 },
  { title: '备注', key: 'remark' },
  { title: 'IP地址', key: 'ip_address', width: 120 },
  { title: '操作时间', key: 'created_at', width: 160 },
]

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
}))

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    checkin: '签到',
    refund: '退款',
    quality_change: '质量变更',
    status_change: '状态变更',
    export: '导出',
    other: '其他',
  }
  return map[type] || type
}

const typeTagType = (type: string) => {
  const map: Record<string, any> = {
    create: 'success',
    update: 'warning',
    delete: 'error',
    checkin: 'info',
    refund: 'warning',
    quality_change: 'info',
    status_change: 'default',
    export: 'default',
  }
  return map[type] || 'default'
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterType.value) params.operation_type = filterType.value
    if (filterTarget.value) params.target_type = filterTarget.value
    
    const data: any = await api.get('/operation-logs', params)
    data.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    message.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>
