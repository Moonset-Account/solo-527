<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="font-display text-2xl font-bold text-inkBlack">学员管理</h1>
      <el-input
        v-model="filters.keyword"
        placeholder="搜索学员姓名/邮箱"
        clearable
        class="w-64"
        :prefix-icon="Search"
      />
    </div>

    <div class="bg-white rounded-card shadow-sm overflow-hidden">
      <el-table :data="students" v-loading="loading">
        <el-table-column prop="avatar" label="头像" width="100">
          <template #default="{ row }">
            <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
              {{ row.name?.[0] || '学' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="140">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="enrollments_count" label="报名次数" width="100">
          <template #default="{ row }">{{ row.enrollments_count || 0 }}</template>
        </el-table-column>
        <el-table-column prop="works_count" label="作品数" width="100">
          <template #default="{ row }">{{ row.works_count || 0 }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>详情</el-button>
            <el-button size="small" type="danger" link>
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="mt-6 flex justify-center">
      <el-pagination
        v-model:current-page="filters.page"
        :page-size="filters.per_page"
        :total="total"
        layout="prev, pager, next"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import type { User } from '@/types'

const loading = ref(false)
const students = ref<User[]>([])
const total = ref(0)

const filters = reactive({
  keyword: '',
  page: 1,
  per_page: 20
})

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const fetchStudents = async () => {
  loading.value = true
  try {
    students.value = [
      { id: 1, name: '张小美', email: 'student1@example.com', phone: '138****0001', role: 'student', enrollments_count: 5, works_count: 3, created_at: '2023-12-01T10:00:00', status: 'active' } as User,
      { id: 2, name: '李大伟', email: 'student2@example.com', phone: '139****0002', role: 'student', enrollments_count: 3, works_count: 2, created_at: '2023-12-10T15:30:00', status: 'active' } as User,
      { id: 3, name: '王小芳', email: 'student3@example.com', phone: '137****0003', role: 'student', enrollments_count: 8, works_count: 5, created_at: '2023-11-15T09:20:00', status: 'active' } as User,
      { id: 4, name: '赵小明', email: 'student4@example.com', phone: '136****0004', role: 'student', enrollments_count: 1, works_count: 0, created_at: '2024-01-10T14:00:00', status: 'active' } as User,
      { id: 5, name: '陈思琪', email: 'student5@example.com', phone: '135****0005', role: 'student', enrollments_count: 4, works_count: 2, created_at: '2023-12-20T11:10:00', status: 'active' } as User
    ]
    total.value = 28
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStudents()
})
</script>
