<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  artClasses: Object,
  filters: Object,
  teachers: Array,
})

const showModal = ref(false)
const editingClass = ref(null)
const form = ref(getDefaultForm())

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: '素描', label: '素描' },
  { value: '色彩', label: '色彩' },
  { value: '速写', label: '速写' },
  { value: '设计', label: '设计' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '进行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'completed', label: '已结束' },
]

const levelOptions = ['初级', '中级', '高级']

const filterSearch = ref(props.filters?.search || '')
const filterType = ref(props.filters?.type || '')
const filterStatus = ref(props.filters?.status || '')
const filterTeacher = ref(props.filters?.teacher_id || '')

function getDefaultForm() {
  return {
    name: '',
    type: '素描',
    level: '初级',
    teacher_id: '',
    start_date: '',
    end_date: '',
    max_students: 30,
    description: '',
    status: 'active',
  }
}

function openCreateModal() {
  editingClass.value = null
  form.value = getDefaultForm()
  showModal.value = true
}

function openEditModal(artClass) {
  editingClass.value = artClass
  form.value = {
    name: artClass.name,
    type: artClass.type,
    level: artClass.level,
    teacher_id: artClass.teacher_id,
    start_date: artClass.start_date,
    end_date: artClass.end_date,
    max_students: artClass.max_students,
    description: artClass.description || '',
    status: artClass.status,
  }
  showModal.value = true
}

function submitForm() {
  if (editingClass.value) {
    router.put(route('art-classes.update', editingClass.value.id), form.value, {
      onSuccess: () => { showModal.value = false },
    })
  } else {
    router.post(route('art-classes.store'), form.value, {
      onSuccess: () => { showModal.value = false },
    })
  }
}

function applyFilters() {
  router.get(route('art-classes.index'), {
    search: filterSearch.value,
    type: filterType.value,
    status: filterStatus.value,
    teacher_id: filterTeacher.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterType, filterStatus, filterTeacher], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})

const statusLabel = {
  active: '进行中',
  paused: '已暂停',
  completed: '已结束',
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="艺考班级">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">艺考班级</h2>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        新增班级
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索班级名称..." />
        <select
          v-model="filterType"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select
          v-model="filterStatus"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select
          v-model="filterTeacher"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全部教师</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">班级名称</th>
            <th class="px-5 py-3 font-medium">类型</th>
            <th class="px-5 py-3 font-medium">授课教师</th>
            <th class="px-5 py-3 font-medium">学生数</th>
            <th class="px-5 py-3 font-medium">开课日期</th>
            <th class="px-5 py-3 font-medium">状态</th>
            <th class="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cls in artClasses.data" :key="cls.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ cls.name }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ cls.type }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ cls.teacher?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ cls.students_count ?? cls.students?.length ?? 0 }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ cls.start_date }}</td>
            <td class="px-5 py-3">
              <StatusBadge :status="cls.status" />
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <Link
                  :href="route('art-classes.show', cls.id)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  查看
                </Link>
                <button
                  @click="openEditModal(cls)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  编辑
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="artClasses.data.length === 0">
            <td colspan="7" class="px-5 py-10 text-center text-sm text-gray-500">暂无班级数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="artClasses.links" />
    </div>

    <Modal :show="showModal" :title="editingClass ? '编辑班级' : '新增班级'" max-width="lg" @close="showModal = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">班级名称</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              v-model="form.type"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option v-for="opt in typeOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">级别</label>
            <select
              v-model="form.level"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">授课教师</label>
            <select
              v-model="form.teacher_id"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">请选择教师</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开课日期</label>
            <input
              v-model="form.start_date"
              type="date"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结课日期</label>
            <input
              v-model="form.end_date"
              type="date"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">最大学生数</label>
            <input
              v-model.number="form.max_students"
              type="number"
              min="1"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              v-model="form.status"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option v-for="opt in statusOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {{ editingClass ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
