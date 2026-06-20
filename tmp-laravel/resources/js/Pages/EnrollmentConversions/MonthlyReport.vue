<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  monthlyData: Array,
  conversionStats: Object,
})

const filterYear = ref(new Date().getFullYear().toString())
const filterMonth = ref('')

const maxRate = computed(() => {
  if (!props.monthlyData?.length) return 100
  const max = Math.max(...props.monthlyData.map(d => d.conversion_rate || 0))
  return Math.max(max, 10)
})

function barWidth(rate) {
  return Math.min((rate / maxRate.value) * 100, 100)
}

function applyFilters() {
  router.get(route('enrollment-conversions.monthly-report'), {
    year: filterYear.value,
    month: filterMonth.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterYear, filterMonth], () => {
  applyFilters()
})

function exportReport() {
  router.post(route('enrollment-conversions.export-monthly'), {
    year: filterYear.value,
    month: filterMonth.value,
  })
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="招生转化月度报表">
    <div class="mb-6">
      <Link
        :href="route('enrollment-conversions.index')"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回招生转化
      </Link>
    </div>

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">招生转化月度报表</h2>
      <div class="flex items-center gap-3">
        <select
          v-model="filterYear"
          class="py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
        </select>
        <select
          v-model="filterMonth"
          class="py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全年</option>
          <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
        </select>
        <button
          @click="exportReport"
          class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          导出报表
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">转化率趋势</h3>
      <div class="space-y-3">
        <div v-for="item in monthlyData" :key="item.month" class="flex items-center gap-3">
          <div class="w-16 text-sm text-gray-600 text-right shrink-0">{{ item.month }}</div>
          <div class="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
            <div
              class="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
              :style="{ width: barWidth(item.conversion_rate) + '%' }"
            >
              <span class="text-xs font-medium text-white whitespace-nowrap">{{ item.conversion_rate }}%</span>
            </div>
          </div>
          <div class="w-20 text-xs text-gray-500 shrink-0">
            {{ item.total_conversions }}/{{ item.total_trials }}
          </div>
        </div>
        <div v-if="!monthlyData?.length" class="text-center text-sm text-gray-500 py-6">
          暂无数据
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">月份</th>
            <th class="px-5 py-3 font-medium">试听数</th>
            <th class="px-5 py-3 font-medium">转化数</th>
            <th class="px-5 py-3 font-medium">转化率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in monthlyData" :key="item.month" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ item.month }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ item.total_trials }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ item.total_conversions }}</td>
            <td class="px-5 py-3 text-sm font-semibold text-indigo-600">{{ item.conversion_rate }}%</td>
          </tr>
          <tr v-if="!monthlyData?.length">
            <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout>
</template>
