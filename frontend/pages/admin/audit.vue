<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>操作日志</span>
        <n-select
          v-model:value="filterAction"
          placeholder="操作类型"
          :options="actionOptions"
          style="width: 140px"
          clearable
          @update:value="loadLogs"
        />
      </div>
    </template>

    <n-data-table
      :columns="columns"
      :data="logs"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />

    <n-pagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :item-count="total"
      show-size-picker
      style="margin-top: 16px; justify-content: flex-end"
      @update:page="loadLogs"
      @update:page-size="loadLogs"
    />
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import { formatDateTime } from '~/utils/dict'
import type { AuditLog } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const filterAction = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const actionOptions = [
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '状态变更', value: 'status_change' },
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
]

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '操作人', key: 'username', width: 120 },
  { title: '角色', key: 'role', width: 80 },
  { title: '操作', key: 'action', width: 100 },
  { title: '对象类型', key: 'entity_type', width: 120 },
  { title: '对象ID', key: 'entity_id', width: 80 },
  { title: '描述', key: 'description', ellipsis: true },
  { title: 'IP地址', key: 'ip_address', width: 120 },
  {
    title: '时间',
    key: 'created_at',
    width: 170,
    render(row: any) {
      return formatDateTime(row.created_at)
    },
  },
]

async function loadLogs() {
  loading.value = true
  try {
    const res = await api.get('/admin/audit-logs', {
      params: {
        action: filterAction.value || undefined,
        skip: (page.value - 1) * pageSize.value,
        limit: pageSize.value,
      },
    })
    logs.value = res.data
  } catch (e) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
