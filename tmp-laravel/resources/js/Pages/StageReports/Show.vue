<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import StatusBadge from '@/Components/StatusBadge.vue'
import { computed } from 'vue'

const props = defineProps({
  report: Object,
})

const stageTypeLabels = {
  weekly: '周报',
  monthly: '月报',
  phase: '阶段报告',
}

const avgAttendance = computed(() => {
  const items = props.report.items || []
  if (!items.length) return 0
  const sum = items.reduce((acc, item) => acc + (item.attendance_rate || 0), 0)
  return (sum / items.length).toFixed(1)
})

const avgHomework = computed(() => {
  const items = props.report.items || []
  if (!items.length) return 0
  const sum = items.reduce((acc, item) => acc + (item.homework_score || 0), 0)
  return (sum / items.length).toFixed(1)
})

const avgArtwork = computed(() => {
  const items = props.report.items || []
  if (!items.length) return 0
  const sum = items.reduce((acc, item) => acc + (item.artwork_score || 0), 0)
  return (sum / items.length).toFixed(1)
})

const avgOverall = computed(() => {
  const items = props.report.items || []
  if (!items.length) return 0
  const sum = items.reduce((acc, item) => acc + (item.overall_score || 0), 0)
  return (sum / items.length).toFixed(1)
})

function generateReport() {
  router.post(route('stage-reports.generate', props.report.id), {}, { preserveScroll: true })
}

function publishReport() {
  router.post(route('stage-reports.publish', props.report.id), {}, { preserveScroll: true })
}

function exportPdf() {
  router.post(route('stage-reports.export-pdf', props.report.id))
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" :page-title="report.title">
    <div class="mb-6">
      <Link
        :href="route('stage-reports.index')"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回报告列表
      </Link>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h2 class="text-xl font-bold text-gray-900">{{ report.title }}</h2>
              <StatusBadge :status="report.status" />
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span>班级：{{ report.art_class?.name || '-' }}</span>
              <span>阶段类型：{{ stageTypeLabels[report.stage_type] || report.stage_type }}</span>
              <span>考核周期：{{ report.start_date }} ~ {{ report.end_date }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="report.status === 'draft'"
              @click="generateReport"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              生成报告
            </button>
            <button
              v-if="report.status === 'generated'"
              @click="publishReport"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              发布
            </button>
            <button
              v-if="report.status === 'generated' || report.status === 'published'"
              @click="exportPdf"
              class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              导出PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500 mb-1">平均出勤率</div>
        <div class="text-2xl font-bold text-gray-900">{{ avgAttendance }}%</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500 mb-1">平均作业分</div>
        <div class="text-2xl font-bold text-gray-900">{{ avgHomework }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500 mb-1">平均作品分</div>
        <div class="text-2xl font-bold text-gray-900">{{ avgArtwork }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500 mb-1">综合平均分</div>
        <div class="text-2xl font-bold text-indigo-600">{{ avgOverall }}</div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-900">学生成绩明细</h3>
      </div>
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">排名</th>
            <th class="px-5 py-3 font-medium">学生姓名</th>
            <th class="px-5 py-3 font-medium">出勤率</th>
            <th class="px-5 py-3 font-medium">作业分</th>
            <th class="px-5 py-3 font-medium">作品分</th>
            <th class="px-5 py-3 font-medium">综合分</th>
            <th class="px-5 py-3 font-medium">教师评语</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in report.items" :key="item.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm text-gray-600">{{ index + 1 }}</td>
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ item.student?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ item.attendance_rate }}%</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ item.homework_score }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ item.artwork_score }}</td>
            <td class="px-5 py-3 text-sm font-semibold text-indigo-600">{{ item.overall_score }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{{ item.teacher_comment || '-' }}</td>
          </tr>
          <tr v-if="!report.items?.length">
            <td colspan="7" class="px-5 py-10 text-center text-sm text-gray-500">暂无学生数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-6 flex items-center gap-3">
      <Link
        :href="route('stage-reports.index')"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        返回列表
      </Link>
      <button
        v-if="report.status === 'generated'"
        @click="publishReport"
        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        发布报告
      </button>
      <button
        v-if="report.status === 'generated' || report.status === 'published'"
        @click="exportPdf"
        class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        导出PDF
      </button>
    </div>
  </AdminLayout>
</template>
