<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { Link } from '@inertiajs/vue3'

defineProps({
  totalClasses: Number,
  totalStudents: Number,
  totalTeachers: Number,
  recentFeedback: Array,
  upcomingTrials: Number,
  pendingConflicts: Number,
  monthlyConversions: Number,
})

const stats = (props) => [
  {
    label: '班级总数',
    value: props.totalClasses,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: 'class',
  },
  {
    label: '学生总数',
    value: props.totalStudents,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: 'student',
  },
  {
    label: '教师总数',
    value: props.totalTeachers,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    icon: 'teacher',
  },
  {
    label: '本月转化',
    value: props.monthlyConversions,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    icon: 'conversion',
  },
]

const feedbackTypeLabels = {
  positive: '正面',
  neutral: '中性',
  negative: '负面',
}

const feedbackTypeColors = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-700',
  negative: 'bg-red-100 text-red-700',
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="仪表盘">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="stat in stats($props)" :key="stat.label" class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center gap-4">
          <div :class="[stat.iconBg, 'w-12 h-12 rounded-lg flex items-center justify-center']">
            <svg v-if="stat.icon === 'class'" :class="[stat.iconColor, 'w-6 h-6']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <svg v-else-if="stat.icon === 'student'" :class="[stat.iconColor, 'w-6 h-6']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else-if="stat.icon === 'teacher'" :class="[stat.iconColor, 'w-6 h-6']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <svg v-else-if="stat.icon === 'conversion'" :class="[stat.iconColor, 'w-6 h-6']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="px-5 py-4 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">最近反馈</h2>
        </div>
        <div v-if="recentFeedback.length === 0" class="p-5 text-sm text-gray-500">暂无反馈记录</div>
        <table v-else class="w-full">
          <thead>
            <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
              <th class="px-5 py-3 font-medium">学生</th>
              <th class="px-5 py-3 font-medium">类型</th>
              <th class="px-5 py-3 font-medium">内容</th>
              <th class="px-5 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fb in recentFeedback" :key="fb.id" class="border-b border-gray-50 last:border-0">
              <td class="px-5 py-3 text-sm text-gray-900">{{ fb.student?.name || '-' }}</td>
              <td class="px-5 py-3">
                <span :class="[feedbackTypeColors[fb.feedback_type] || 'bg-gray-100 text-gray-700', 'inline-block px-2 py-0.5 text-xs font-medium rounded-full']">
                  {{ feedbackTypeLabels[fb.feedback_type] || fb.feedback_type }}
                </span>
              </td>
              <td class="px-5 py-3 text-sm text-gray-600 max-w-[200px] truncate">{{ fb.content }}</td>
              <td class="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">{{ fb.created_at }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-white rounded-xl border border-gray-200">
        <div class="px-5 py-4 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">待处理事项</h2>
        </div>
        <div class="p-5 space-y-4">
          <Link :href="route('schedule-conflicts.index')" class="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">排课冲突</p>
                <p class="text-xs text-gray-500">待处理冲突</p>
              </div>
            </div>
            <span class="text-xl font-bold text-red-600">{{ pendingConflicts }}</span>
          </Link>

          <Link :href="route('trial-bookings.index')" class="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">试听预约</p>
                <p class="text-xs text-gray-500">待确认试听</p>
              </div>
            </div>
            <span class="text-xl font-bold text-amber-600">{{ upcomingTrials }}</span>
          </Link>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
