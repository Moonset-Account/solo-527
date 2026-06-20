<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  reports: Object,
  filters: Object,
  artClasses: Array,
})

const showModal = ref(false)
const form = ref(getDefaultForm())

const stageTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'weekly', label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'phase', label: '阶段报告' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'generated', label: '已生成' },
  { value: 'published', label: '已发布' },
]

const filterSearch = ref(props.filters?.search || '')
const filterArtClass = ref(props.filters?.art_class_id || '')
const filterStageType = ref(props.filters?.stage_type || '')
const filterStatus = ref(props.filters?.status || '')

const stageTypeLabels = {
  weekly: '周报',
  monthly: '月报',
  phase: '阶段报告',
}

function getDefaultForm() {
  return {
    title: '',
    art_class_id: '',
    stage_type: 'weekly',
    start_date: '',
    end_date: '',
    config: {
      attendance: true,
      homework: true,
      artwork_scores: true,
    },
  }
}

function openCreateModal() {
  form.value = getDefaultForm()
  showModal.value = true
}

function submitForm() {
  router.post(route('stage-reports.store'), form.value, {
    onSuccess: () => { showModal.value = false },
  })
}

function applyFilters() {
  router.get(route('stage-reports.index'), {
    search: filterSearch.value,
    art_class_id: filterArtClass.value,
    stage_type: filterStageType.value,
    status: filterStatus.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterArtClass, filterStageType, filterStatus], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})

function generateReport(report) {
  router.post(route('stage-reports.generate', report.id), {}, { preserveScroll: true })
}

function editReport(report) {
  router.get(route('stage-reports.edit', report.id))
}

function deleteReport(report) {
  if (confirm('确定删除该报告？')) {
    router.delete(route('stage-reports.destroy', report.id), { preserveScroll: true })
  }
}

function publishReport(report) {
  router.post(route('stage-reports.publish', report.id), {}, { preserveScroll: true })
}

function exportPdf(report) {
  router.post(route('stage-reports.export-pdf', report.id))
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="阶段报告">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">阶段报告</h2>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        创建报告
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索报告标题..." />
        <select
          v-model="filterArtClass"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全部班级</option>
          <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <select
          v-model="filterStageType"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in stageTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select
          v-model="filterStatus"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">报告标题</th>
            <th class="px-5 py-3 font-medium">班级</th>
            <th class="px-5 py-3 font-medium">阶段类型</th>
            <th class="px-5 py-3 font-medium">考核周期</th>
            <th class="px-5 py-3 font-medium">状态</th>
            <th class="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reports.data" :key="report.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ report.title }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ report.art_class?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ stageTypeLabels[report.stage_type] || report.stage_type }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ report.start_date }} ~ {{ report.end_date }}</td>
            <td class="px-5 py-3">
              <StatusBadge :status="report.status" />
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <button
                  v-if="report.status === 'draft'"
                  @click="generateReport(report)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  生成
                </button>
                <button
                  v-if="report.status === 'draft'"
                  @click="editReport(report)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  编辑
                </button>
                <button
                  v-if="report.status === 'draft'"
                  @click="deleteReport(report)"
                  class="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  删除
                </button>
                <button
                  v-if="report.status === 'generated'"
                  @click="publishReport(report)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  发布
                </button>
                <button
                  v-if="report.status === 'generated'"
                  @click="exportPdf(report)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  导出PDF
                </button>
                <button
                  v-if="report.status === 'published'"
                  @click="exportPdf(report)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  导出PDF
                </button>
                <Link
                  v-if="report.status === 'published'"
                  :href="route('stage-reports.show', report.id)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  查看详情
                </Link>
              </div>
            </td>
          </tr>
          <tr v-if="reports.data.length === 0">
            <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500">暂无报告数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="reports.links" />
    </div>

    <Modal :show="showModal" title="创建报告" max-width="lg" @close="showModal = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">报告标题</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">班级</label>
            <select
              v-model="form.art_class_id"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">请选择班级</option>
              <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">阶段类型</label>
            <select
              v-model="form.stage_type"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option v-for="opt in stageTypeOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              v-model="form.start_date"
              type="date"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              v-model="form.end_date"
              type="date"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">报告内容</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input v-model="form.config.attendance" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span class="text-sm text-gray-700">出勤数据</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="form.config.homework" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span class="text-sm text-gray-700">作业数据</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="form.config.artwork_scores" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span class="text-sm text-gray-700">作品评分</span>
            </label>
          </div>
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
            创建
          </button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
