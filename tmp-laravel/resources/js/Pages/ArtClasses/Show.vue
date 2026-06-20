<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref } from 'vue'

const props = defineProps({
  artClass: Object,
})

const activeTab = ref('students')

const tabs = [
  { key: 'students', label: '学生列表' },
  { key: 'artworks', label: '作品列表' },
  { key: 'reports', label: '阶段报告' },
]

const typeColorMap = {
  '素描': 'bg-blue-100 text-blue-700',
  '色彩': 'bg-pink-100 text-pink-700',
  '速写': 'bg-amber-100 text-amber-700',
  '设计': 'bg-purple-100 text-purple-700',
}

const stageTypeLabels = {
  monthly: '月考',
  midterm: '期中',
  final: '期末',
  custom: '自定义',
}

function publishReport(report) {
  router.put(route('stage-reports.update', report.id), { status: 'published' }, { preserveScroll: true })
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" :page-title="artClass.name">
    <div class="mb-6">
      <Link
        :href="route('art-classes.index')"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回班级列表
      </Link>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h2 class="text-xl font-bold text-gray-900">{{ artClass.name }}</h2>
              <span :class="[typeColorMap[artClass.type] || 'bg-gray-100 text-gray-700', 'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium']">
                {{ artClass.type }}
              </span>
              <StatusBadge :status="artClass.status" />
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span>授课教师：{{ artClass.teacher?.name || '-' }}</span>
              <span>级别：{{ artClass.level }}</span>
              <span>开课：{{ artClass.start_date }}</span>
              <span>结课：{{ artClass.end_date }}</span>
            </div>
          </div>
          <Link
            :href="route('art-classes.index')"
            class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            编辑
          </Link>
        </div>
      </div>
    </div>

    <div class="mb-4 border-b border-gray-200">
      <nav class="flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <div v-if="activeTab === 'students'">
      <div class="bg-white rounded-xl border border-gray-200">
        <table class="w-full">
          <thead>
            <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
              <th class="px-5 py-3 font-medium">姓名</th>
              <th class="px-5 py-3 font-medium">性别</th>
              <th class="px-5 py-3 font-medium">监护人</th>
              <th class="px-5 py-3 font-medium">联系电话</th>
              <th class="px-5 py-3 font-medium">入学日期</th>
              <th class="px-5 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in artClass.students" :key="student.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ student.name }}</td>
              <td class="px-5 py-3 text-sm text-gray-600">{{ student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-' }}</td>
              <td class="px-5 py-3 text-sm text-gray-600">{{ student.guardian || '-' }}</td>
              <td class="px-5 py-3 text-sm text-gray-600">{{ student.phone || '-' }}</td>
              <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ student.enrollment_date || '-' }}</td>
              <td class="px-5 py-3">
                <StatusBadge :status="student.status" />
              </td>
            </tr>
            <tr v-if="!artClass.students?.length">
              <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500">暂无学生数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'artworks'">
      <div v-if="!artClass.artworks?.length" class="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
        暂无作品数据
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="artwork in artClass.artworks"
          :key="artwork.id"
          class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div class="aspect-[4/3] bg-gray-100 flex items-center justify-center">
            <img
              v-if="artwork.image_url"
              :src="artwork.image_url"
              :alt="artwork.title"
              class="w-full h-full object-cover"
            />
            <svg v-else class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="p-4">
            <h4 class="text-sm font-medium text-gray-900 truncate">{{ artwork.title }}</h4>
            <p class="text-xs text-gray-500 mt-1">{{ artwork.student?.name || '-' }}</p>
            <div class="flex items-center justify-between mt-2">
              <StatusBadge :status="artwork.status" />
              <span v-if="artwork.score" class="text-sm font-bold text-indigo-600">{{ artwork.score }}分</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'reports'">
      <div class="bg-white rounded-xl border border-gray-200">
        <table class="w-full">
          <thead>
            <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
              <th class="px-5 py-3 font-medium">标题</th>
              <th class="px-5 py-3 font-medium">阶段类型</th>
              <th class="px-5 py-3 font-medium">考核周期</th>
              <th class="px-5 py-3 font-medium">状态</th>
              <th class="px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in artClass.stage_reports" :key="report.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ report.title }}</td>
              <td class="px-5 py-3 text-sm text-gray-600">{{ stageTypeLabels[report.stage_type] || report.stage_type }}</td>
              <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ report.period }}</td>
              <td class="px-5 py-3">
                <StatusBadge :status="report.status" />
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <button
                    v-if="report.status === 'draft'"
                    @click="$inertia.visit(route('stage-reports.show', report.id))"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    生成
                  </button>
                  <button
                    v-if="report.status === 'generated'"
                    @click="publishReport(report)"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    发布
                  </button>
                  <button
                    v-if="report.status === 'published'"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    导出
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!artClass.stage_reports?.length">
              <td colspan="5" class="px-5 py-10 text-center text-sm text-gray-500">暂无报告数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>
