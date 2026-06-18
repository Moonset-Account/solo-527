<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Phone, MapPin } from 'lucide-vue-next'
import { useLeadsStore } from '@/stores/leads'
import StatusBadge from '@/components/common/StatusBadge.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import type { LeadStatus, FilterField } from '@/types'

const router = useRouter()
const leadsStore = useLeadsStore()

const filterFields: FilterField[] = [
  {
    key: 'status', label: '状态', type: 'select',
    options: [
      { label: '新线索', value: 'new' },
      { label: '已联系', value: 'contacted' },
      { label: '已量房', value: 'measured' },
      { label: '已报价', value: 'quoted' },
      { label: '已签约', value: 'contracted' },
      { label: '已流失', value: 'lost' },
    ],
  },
  {
    key: 'source', label: '来源', type: 'select',
    options: [
      { label: '官网', value: 'website' },
      { label: '小程序', value: 'miniapp' },
      { label: '转介绍', value: 'referral' },
      { label: '线下', value: 'offline' },
      { label: '广告', value: 'ad' },
    ],
  },
  { key: 'dateRange', label: '日期', type: 'dateRange' },
]

const filters = ref<Record<string, unknown>>({
  status: '',
  source: '',
  dateRange: [],
})

const totalPages = computed(() => Math.ceil(leadsStore.total / leadsStore.pageSize) || 1)

const statusBorderMap: Record<string, string> = {
  new: 'border-l-blue-500',
  contacted: 'border-l-amber-500',
  measured: 'border-l-cyan-500',
  quoted: 'border-l-purple-500',
  contracted: 'border-l-emerald-500',
  lost: 'border-l-red-500',
}

function openDetail(id: number) {
  router.push(`/leads/${id}`)
}

function handleSearch() {
  leadsStore.setFilters(filters.value as any)
  leadsStore.fetchList()
}

function handleReset() {
  filters.value = { status: '', source: '', dateRange: [] }
  leadsStore.setFilters({})
  leadsStore.fetchList()
}

function handlePageChange(page: number) {
  leadsStore.setPage(page)
  leadsStore.fetchList()
}

onMounted(() => {
  leadsStore.fetchList()
  leadsStore.fetchStats()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">线索管理</h1>
    </div>

    <FilterBar
      :fields="filterFields"
      v-model="filters"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-sm text-slate-500">总线索数</p>
        <p class="text-2xl font-bold text-slate-800 mt-1">{{ leadsStore.stats.total }}</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-sm text-slate-500">本周新增</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ leadsStore.stats.newThisWeek }}</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-sm text-slate-500">转化率</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">{{ leadsStore.stats.conversionRate }}%</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-sm text-slate-500">平均响应</p>
        <p class="text-2xl font-bold text-purple-600 mt-1">{{ leadsStore.stats.avgResponseTime }}h</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="lead in leadsStore.list"
        :key="lead.id"
        class="bg-white rounded-lg border border-slate-200 border-l-4 p-4 cursor-pointer hover:shadow-md transition-shadow"
        :class="statusBorderMap[lead.status] || 'border-l-slate-400'"
        @click="openDetail(lead.id)"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium text-slate-800">{{ lead.customerName }}</span>
          <StatusBadge :status="lead.status" />
        </div>
        <div class="flex items-center gap-1 text-sm text-slate-500 mb-1">
          <Phone class="w-3 h-3" />
          {{ lead.phone }}
        </div>
        <div class="flex items-center gap-1 text-sm text-slate-500 mb-2">
          <MapPin class="w-3 h-3" />
          {{ lead.source }} · {{ lead.style || '未定' }}
        </div>
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>预算: {{ lead.budgetMin }}-{{ lead.budgetMax }}万</span>
          <span>{{ lead.assignedToName }}</span>
        </div>
        <div class="flex items-center gap-1 mt-2">
          <span
            v-for="tag in lead.tags?.slice(0, 2)"
            :key="tag.id"
            class="inline-block px-1.5 py-0.5 rounded text-xs"
            :style="{ backgroundColor: tag.color + '20', color: tag.color }"
          >
            {{ tag.name }}
          </span>
          <span v-if="lead.tags?.length > 2" class="text-xs text-slate-400">+{{ lead.tags.length - 2 }}</span>
        </div>
        <div class="text-xs text-slate-400 mt-2">
          {{ lead.lastFollowupDate ? `上次回访: ${lead.lastFollowupDate}` : '未回访' }}
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-500">共 {{ leadsStore.total }} 条</span>
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 text-sm rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
          :disabled="leadsStore.page <= 1"
          @click="handlePageChange(leadsStore.page - 1)"
        >
          上一页
        </button>
        <span class="text-sm text-slate-700">{{ leadsStore.page }} / {{ totalPages }}</span>
        <button
          class="px-3 py-1.5 text-sm rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
          :disabled="leadsStore.page >= totalPages"
          @click="handlePageChange(leadsStore.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <button
      class="fixed right-8 bottom-8 w-14 h-14 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-colors flex items-center justify-center"
    >
      <Plus class="w-6 h-6" />
    </button>
  </div>
</template>
