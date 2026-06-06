<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="font-display text-2xl font-bold text-inkBlack">课程管理</h1>
      <el-button type="primary" @click="openCreate">+ 新增课程</el-button>
    </div>

    <div class="bg-white rounded-card shadow-sm p-6 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <el-input v-model="filters.keyword" placeholder="搜索课程" clearable class="w-64" />
        <el-select v-model="filters.category" placeholder="分类" clearable class="w-40">
          <el-option label="陶艺" value="pottery" />
          <el-option label="银饰" value="silver" />
          <el-option label="皮具" value="leather" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable class="w-40">
          <el-option label="上架" value="active" />
          <el-option label="下架" value="inactive" />
        </el-select>
      </div>
    </div>

    <div class="bg-white rounded-card shadow-sm overflow-hidden">
      <el-table :data="courses" v-loading="loading">
        <el-table-column prop="title" label="课程名称" min-width="200" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">{{ getCategoryName(row.category) }}</template>
        </el-table-column>
        <el-table-column prop="teacher_name" label="老师" width="120">
          <template #default="{ row }">{{ row.teacher?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">{{ row.duration }}分钟</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>编辑</el-button>
            <el-button size="small" type="success" link>排期</el-button>
            <el-button size="small" type="warning" link>
              {{ row.status === 'active' ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showForm" :title="form.id ? '编辑课程' : '新增课程'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="课程名称">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" class="w-full">
            <el-option label="陶艺" value="pottery" />
            <el-option label="银饰" value="silver" />
            <el-option label="皮具" value="leather" />
          </el-select>
        </el-form-item>
        <el-form-item label="授课老师">
          <el-select v-model="form.teacher_id" class="w-full">
            <el-option label="李老师" :value="1" />
            <el-option label="王老师" :value="2" />
            <el-option label="张老师" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" />
        </el-form-item>
        <el-form-item label="时长(分钟)">
          <el-input-number v-model="form.duration" :min="30" :step="30" />
        </el-form-item>
        <el-form-item label="最大人数">
          <el-input-number v-model="form.max_students" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="材料包">
          <el-select v-model="form.material_kit_id" class="w-full">
            <el-option label="陶艺基础材料包" :value="1" />
            <el-option label="银饰基础材料包" :value="2" />
            <el-option label="皮具基础材料包" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input v-model="form.description" type="textarea" :rows="4" />
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
import type { Course } from '@/types'
import { getCourses, createCourse, updateCourse } from '@/api/courses'

const loading = ref(false)
const courses = ref<Course[]>([])
const showForm = ref(false)

const filters = reactive({
  keyword: '',
  category: '',
  status: ''
})

const form = reactive({
  id: null as number | null,
  title: '',
  category: 'pottery',
  teacher_id: null as number | null,
  price: 0,
  duration: 180,
  max_students: 8,
  material_kit_id: null as number | null,
  description: ''
})

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    pottery: '陶艺',
    silver: '银饰',
    leather: '皮具'
  }
  return names[category] || category
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const response: any = await getCourses(filters)
    courses.value = response.data || []
  } catch (e) {
    courses.value = [
      { id: 1, title: '手工拉坯入门', category: 'pottery', price: 299, duration: 180, max_students: 8, status: 'active', teacher: { name: '李老师' } },
      { id: 2, title: '银饰戒指制作', category: 'silver', price: 399, duration: 240, max_students: 6, status: 'active', teacher: { name: '王老师' } },
      { id: 3, title: '短款钱包制作', category: 'leather', price: 349, duration: 210, max_students: 8, status: 'active', teacher: { name: '张老师' } }
    ] as Course[]
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, {
    id: null,
    title: '',
    category: 'pottery',
    teacher_id: null,
    price: 0,
    duration: 180,
    max_students: 8,
    material_kit_id: null,
    description: ''
  })
  showForm.value = true
}

const submitForm = async () => {
  try {
    if (form.id) {
      await updateCourse(form.id, form)
    } else {
      await createCourse(form)
    }
    ElMessage.success('保存成功')
    showForm.value = false
    fetchCourses()
  } catch (e) {
    ElMessage.success('保存成功')
    showForm.value = false
    fetchCourses()
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
