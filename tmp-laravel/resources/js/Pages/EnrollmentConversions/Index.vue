<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  conversions: Object,
  filters: Object,
})

const conversionTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'direct', label: '直接转化' },
  { value: 'follow_up', label: '跟进转化' },
]

const filterSearch = ref(props.filters?.search || '')
const filterMonth = ref(props.filters?.month || '')
const filterConversionType = ref(props.filters?.conversion_type || '')
const filterArtClass = ref(props.filters?.art_class_id || '')

const conversionTypeLabels = {
  direct: '直接转化',
  follow_up: '跟进转化',
}

const totalConversions = computed(() => props.conversions.total || 0)

const conversionRate = computed(() => {
  const meta = props.conversions.meta
  if (meta && meta.conversion_rate !== undefined) return meta.conversion_rate
  return 0
})

function applyFilters() {
  router.get(route('enrollment-conversions.index'), {
    search: filterSearch.value,
    month: filterMonth.value,
    conversion_type: filterConversionType.value,
    art_class_id: filterArtClass.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterMonth, filterConversionType, filterArtClass], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="招生转化">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">招生转化</h2>
      <Link
        :href="route('enrollment-conversions.monthly-report')"
        class="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        月度报表
      </Link>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500 mb-1">本期转化总数</div>
        <div class="text-2xl font-bold text-gray-900">{{ totalConversions }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500 mb-1">转化率</div>
        <div class="text-2xl font-bold text-indigo-600">{{ conversionRate }}%</div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索学生姓名..." />
        <input
          v-model="filterMonth"
          type="month"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select
          v-model="filterConversionType"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in conversionTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select
          v-model="filterArtClass"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全部班级</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">试听学生</th>
            <th class="px-5 py-3 font-medium">转化班级</th>
            <th class="px-5 py-3 font-medium">转化类型</th>
            <th class="px-5 py-3 font-medium">转化日期</th>
            <th class="px-5 py-3 font-medium">操作人</th>
            <th class="px-5 py-3 font-medium">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="conv in conversions.data" :key="conv.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ conv.student?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ conv.art_class?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ conversionTypeLabels[conv.conversion_type] || conv.conversion_type }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ conv.conversion_date }}</td>
            <td class="px-5 py-3 text-sm text-gray-600">{{ conv.operator?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{{ conv.remark || '-' }}</td>
          </tr>
          <tr v-if="conversions.data.length === 0">
            <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500">暂无转化数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="conversions.links" />
    </div>
  </AdminLayout>
</template>
