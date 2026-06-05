<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center justify-between mb-4">
        <div class="text-lg font-medium">盘点管理</div>
        <el-button type="primary" @click="showAdd = true" v-if="isAdmin">
          <el-icon class="mr-1"><Plus /></el-icon>
          新建盘点
        </el-button>
      </div>
      
      <el-table :data="checks" v-loading="loading">
        <el-table-column prop="check_number" label="盘点单号" width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type === 'FULL' ? '全盘' : '抽盘' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'COMPLETED' ? 'success' : row.status === 'IN_PROGRESS' ? 'primary' : 'warning'" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="discrepancies_count" label="差异数" width="100" />
        <el-table-column label="创建人" width="120">
          <template #default="{ row }">
            {{ row.created_by_user?.full_name }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/inventory/${row.id}`)">详情</el-button>
            <el-button type="primary" link size="small" v-if="row.status !== 'COMPLETED'">继续</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const isAdmin = ref(userStore.isAdmin)
const loading = ref(false)
const checks = ref<any[]>([])
const showAdd = ref(false)

function statusText(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadChecks() {
  loading.value = true
  try {
    const data = await api.get('/inventory/checks?limit=50') as any
    checks.value = data.items || data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadChecks()
})
</script>
