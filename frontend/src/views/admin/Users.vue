<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center justify-between mb-4">
        <div class="text-lg font-medium">用户管理</div>
        <el-button type="primary" @click="showAdd = true">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增用户
        </el-button>
      </div>
      
      <el-table :data="users" v-loading="loading">
        <el-table-column label="用户">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-avatar :size="32" class="mr-3">{{ row.full_name?.charAt(0) || row.username.charAt(0) }}</el-avatar>
              <div>
                <div class="font-medium">{{ row.full_name }}</div>
                <div class="text-xs text-gray-500">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'member' ? 'primary' : 'info'" size="small">
              {{ roleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="部门" width="150" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login_at ? formatDate(row.last_login_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link size="small">编辑</el-button>
            <el-button type="danger" link size="small" v-if="row.id !== currentUserId">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const users = ref<any[]>([])
const showAdd = ref(false)

const currentUserId = computed(() => userStore.user?.id)

function roleText(role: string) {
  const map: Record<string, string> = {
    admin: '管理员',
    member: '实验室成员',
    external: '外部用户'
  }
  return map[role] || role
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadUsers() {
  loading.value = true
  try {
    const data = await api.get('/users?limit=100') as any
    users.value = data.items || data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>
