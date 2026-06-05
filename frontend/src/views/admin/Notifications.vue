<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center justify-between mb-4">
        <div class="text-lg font-medium">通知中心</div>
        <div class="flex gap-2">
          <el-button @click="markAllRead">全部标为已读</el-button>
          <el-select v-model="filterType" placeholder="类型" clearable style="width: 150px" @change="loadNotifications">
            <el-option label="低库存预警" value="LOW_STOCK" />
            <el-option label="过期预警" value="EXPIRY_WARNING" />
            <el-option label="领用通知" value="REQUISITION_CREATED" />
          </el-select>
        </div>
      </div>
      
      <el-table :data="notifications" v-loading="loading">
        <el-table-column width="60">
          <template #default="{ row }">
            <el-icon v-if="!row.is_read" color="#3b82f6"><BellFilled /></el-icon>
            <el-icon v-else color="#9ca3af"><Bell /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeColor(row.type)" size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="message" label="内容" />
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="!row.is_read" type="primary" link size="small" @click="markRead(row)">标为已读</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="mt-4 flex justify-center">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          @current-change="loadNotifications"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { Bell, BellFilled } from '@element-plus/icons-vue'

const loading = ref(false)
const notifications = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterType = ref('')

function typeText(type: string) {
  const map: Record<string, string> = {
    LOW_STOCK: '低库存',
    EXPIRY_WARNING: '过期预警',
    REQUISITION_CREATED: '领用申请',
    REQUISITION_APPROVED: '申请批准',
    REQUISITION_REJECTED: '申请拒绝',
    REQUISITION_CONFIRMED: '申请确认'
  }
  return map[type] || type
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    LOW_STOCK: 'warning',
    EXPIRY_WARNING: 'danger',
    REQUISITION_CREATED: 'primary',
    REQUISITION_APPROVED: 'success',
    REQUISITION_REJECTED: 'danger'
  }
  return map[type] || ''
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadNotifications() {
  loading.value = true
  try {
    const params: any = { page: page.value, limit: pageSize.value }
    if (filterType.value) {
      params.type = filterType.value
    }
    const data = await api.get('/notifications', { params }) as any
    notifications.value = data.items || data || []
    total.value = data.total || data.length || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function markRead(row: any) {
  try {
    await api.patch(`/notifications/${row.id}/read`)
    row.is_read = true
    ElMessage.success('已标记')
  } catch (e) {}
}

async function markAllRead() {
  try {
    await api.patch('/notifications/read-all')
    notifications.value.forEach(n => n.is_read = true)
    ElMessage.success('全部已读')
  } catch (e) {}
}

onMounted(() => {
  loadNotifications()
})
</script>
