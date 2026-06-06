<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="font-display text-2xl font-bold text-inkBlack">老师管理</h1>
      <el-button type="primary" @click="openCreate">+ 新增老师</el-button>
    </div>

    <div class="bg-white rounded-card shadow-sm overflow-hidden">
      <el-table :data="teachers" v-loading="loading">
        <el-table-column prop="avatar" label="头像" width="100">
          <template #default="{ row }">
            <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
              {{ row.user?.name?.[0] || row.name?.[0] || '老' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">{{ row.user?.name || row.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="specialty" label="专长" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.specialty" size="small">{{ getSpecialtyName(row.specialty) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="experience_years" label="教龄" width="100">
          <template #default="{ row }">{{ row.experience_years || 0 }} 年</template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="140">
          <template #default="{ row }">{{ row.user?.phone || row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180">
          <template #default="{ row }">{{ row.user?.email || '-' }}</template>
        </el-table-column>
        <el-table-column prop="courses_count" label="课程数" width="100">
          <template #default="{ row }">{{ row.courses_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>编辑</el-button>
            <el-button size="small" type="danger" link>停用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showForm" :title="form.id ? '编辑老师' : '新增老师'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item label="专长">
          <el-select v-model="form.specialty" class="w-full">
            <el-option label="陶艺" value="pottery" />
            <el-option label="银饰" value="silver" />
            <el-option label="皮具" value="leather" />
          </el-select>
        </el-form-item>
        <el-form-item label="教龄(年)">
          <el-input-number v-model="form.experience_years" :min="0" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="form.bio" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Teacher } from '@/types'

const loading = ref(false)
const teachers = ref<Teacher[]>([])
const showForm = ref(false)

const form = reactive({
  id: null as number | null,
  name: '',
  email: '',
  specialty: 'pottery',
  experience_years: 0,
  phone: '',
  bio: ''
})

const getSpecialtyName = (specialty: string) => {
  const names: Record<string, string> = {
    pottery: '陶艺',
    silver: '银饰',
    leather: '皮具'
  }
  return names[specialty] || specialty
}

const fetchTeachers = async () => {
  loading.value = true
  try {
    teachers.value = [
      { id: 1, name: '李老师', specialty: 'pottery', experience_years: 10, phone: '138****0001', bio: '资深陶艺师，10年教学经验', user: { name: '李老师', email: 'teacher1@example.com', phone: '138****0001' }, courses_count: 8 } as Teacher,
      { id: 2, name: '王老师', specialty: 'silver', experience_years: 7, phone: '139****0002', bio: '珠宝设计专业，专注银饰制作', user: { name: '王老师', email: 'teacher2@example.com', phone: '139****0002' }, courses_count: 6 } as Teacher,
      { id: 3, name: '张老师', specialty: 'leather', experience_years: 5, phone: '137****0003', bio: '意大利皮具工艺学习经历', user: { name: '张老师', email: 'teacher3@example.com', phone: '137****0003' }, courses_count: 5 } as Teacher
    ]
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, {
    id: null,
    name: '',
    email: '',
    specialty: 'pottery',
    experience_years: 0,
    phone: '',
    bio: ''
  })
  showForm.value = true
}

const submitForm = () => {
  ElMessage.success('保存成功')
  showForm.value = false
  fetchTeachers()
}

onMounted(() => {
  fetchTeachers()
})
</script>
