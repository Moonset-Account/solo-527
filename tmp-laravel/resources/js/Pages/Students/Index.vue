<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  students: Object,
  filters: Object,
  artClasses: Array,
})

const showModal = ref(false)
const editingStudent = ref(null)
const form = ref(getDefaultForm())

const genderOptions = [
  { value: '', label: '全部性别' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '在读' },
  { value: 'inactive', label: '休学' },
  { value: 'graduated', label: '毕业' },
]

const genderLabels = { male: '男', female: '女' }

const filterSearch = ref(props.filters?.search || '')
const filterArtClass = ref(props.filters?.art_class_id || '')
const filterGender = ref(props.filters?.gender || '')
const filterStatus = ref(props.filters?.status || '')

function getDefaultForm() {
  return {
    name: '',
    gender: '',
    art_class_id: '',
    birth_date: '',
    phone: '',
    guardian_name: '',
    guardian_phone: '',
    enrollment_date: '',
    notes: '',
    status: 'active',
  }
}

function applyFilters() {
  router.get(route('students.index'), {
    search: filterSearch.value,
    art_class_id: filterArtClass.value,
    gender: filterGender.value,
    status: filterStatus.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterArtClass, filterGender, filterStatus], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})

function openAddModal() {
  editingStudent.value = null
  form.value = getDefaultForm()
  showModal.value = true
}

function openEditModal(student) {
  editingStudent.value = student
  form.value = {
    name: student.name,
    gender: student.gender,
    art_class_id: student.art_class_id,
    birth_date: student.birth_date || '',
    phone: student.phone || '',
    guardian_name: student.guardian_name || '',
    guardian_phone: student.guardian_phone || '',
    enrollment_date: student.enrollment_date || '',
    notes: student.notes || '',
    status: student.status,
  }
  showModal.value = true
}

function submitForm() {
  if (editingStudent.value) {
    router.put(route('students.update', editingStudent.value.id), form.value, {
      onSuccess: () => { showModal.value = false },
    })
  } else {
    router.post(route('students.store'), form.value, {
      onSuccess: () => { showModal.value = false },
    })
  }
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="学生档案">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">学生档案</h2>
      <button
        @click="openAddModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        新增学生
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索学生姓名..." />
        <select v-model="filterArtClass" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">全部班级</option>
          <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <select v-model="filterGender" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option v-for="opt in genderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="filterStatus" class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">姓名</th>
            <th class="px-5 py-3 font-medium">性别</th>
            <th class="px-5 py-3 font-medium">班级</th>
            <th class="px-5 py-3 font-medium">监护人</th>
            <th class="px-5 py-3 font-medium">联系电话</th>
            <th class="px-5 py-3 font-medium">入学日期</th>
            <th class="px-5 py-3 font-medium">状态</th>
            <th class="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students.data" :key="student.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ student.name }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ genderLabels[student.gender] || student.gender }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ student.art_class?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ student.guardian_name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ student.guardian_phone || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ student.enrollment_date || '-' }}</td>
            <td class="px-5 py-3">
              <StatusBadge :status="student.status" />
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <Link :href="route('students.show', student.id)" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">查看</Link>
                <button @click="openEditModal(student)" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">编辑</button>
              </div>
            </td>
          </tr>
          <tr v-if="students.data.length === 0">
            <td colspan="8" class="px-5 py-10 text-center text-sm text-gray-500">暂无学生数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="students.links" />
    </div>

    <Modal :show="showModal" :title="editingStudent ? '编辑学生' : '新增学生'" max-width="lg" @close="showModal = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="form.name" type="text" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <select v-model="form.gender" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">班级</label>
            <select v-model="form.art_class_id" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">请选择班级</option>
              <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
            <input v-model="form.birth_date" type="date" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">电话</label>
            <input v-model="form.phone" type="text" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">监护人</label>
            <input v-model="form.guardian_name" type="text" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">监护人电话</label>
            <input v-model="form.guardian_phone" type="text" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">入学日期</label>
            <input v-model="form.enrollment_date" type="date" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select v-model="form.status" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="active">在读</option>
              <option value="inactive">休学</option>
              <option value="graduated">毕业</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea v-model="form.notes" rows="3" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            {{ editingStudent ? '保存' : '新增' }}
          </button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
