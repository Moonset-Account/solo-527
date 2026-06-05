<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center justify-between mb-4">
        <div class="text-lg font-medium">审计日志</div>
        <div class="text-sm text-gray-500">
          <el-icon class="mr-1"><InfoFilled /></el-icon>
          审计日志不可删除
        </div>
      </div>
      
      <el-table :data="logs" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-tag :type="actionColor(row.action)" size="small">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resource_type" label="资源类型" width="120" />
        <el-table-column prop="resource_id" label="资源ID" width="100" />
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            {{ row.user?.full_name || row.user?.username || '系统' }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column label="详情" min-width="200">
          <template #default="{ row }">
            <pre class="text-xs bg-gray-50 p-2 rounded max-h-20 overflow-auto">{{ JSON.stringify(row.details, null, 2) }}</pre>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      
      <div class="mt-4 flex justify-center">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          @current-change="loadLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api'
import { InfoFilled } from '@element-plus/icons-vue'

const loading = ref(false)
const logs = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

function actionColor(action: string) {
  const map: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'primary',
    DELETE: 'danger',
    APPROVE: 'success',
    CONFIRM: 'success',
    PICK_UP: 'warning',
    LOGIN: 'info'
  }
  return map[action] || ''
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadLogs() {
  loading.value = true
  try {
    const data = await api.get('/audit', { params: { page: page.value, limit: pageSize.value } }) as any
    logs.value = data.items || data || []
    total.value = data.total || data.length || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>
