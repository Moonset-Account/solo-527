<script setup>
import { Link, router } from '@inertiajs/vue3'


const props = defineProps({
  contracts: Object,
  filters: Object,
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_approval', label: '待审批' },
  { value: 'active', label: '生效中' },
  { value: 'expired', label: '已过期' },
  { value: 'terminated', label: '已终止' },
]

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-red-100 text-red-800',
}

const statusLabels = {
  draft: '草稿',
  pending_approval: '待审批',
  active: '生效中',
  expired: '已过期',
  terminated: '已终止',
}

function applyFilter() {
  router.get(route('contracts.index'), props.filters, { preserveState: true, preserveScroll: true })
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">合同管理</h1>
        <Link :href="route('contracts.create')" class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
          新建合同
        </Link>
      </div>

      <div class="rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">状态</label>
            <select v-model="filters.status" @change="applyFilter" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">物业ID</label>
            <input v-model="filters.property_id" @keyup.enter="applyFilter" type="number" placeholder="物业ID" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">开始日期（从）</label>
            <input v-model="filters.date_from" @change="applyFilter" type="date" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">开始日期（至）</label>
            <input v-model="filters.date_to" @change="applyFilter" type="date" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">合同编号</label>
            <input v-model="filters.contract_no" @keyup.enter="applyFilter" type="text" placeholder="搜索合同编号" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">合同编号</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">物业</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">租户</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">招商顾问</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">开始日期</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">结束日期</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">月租金</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="contract in contracts.data" :key="contract.id" class="hover:bg-gray-50 transition-colors">
              <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600">
                <Link :href="route('contracts.show', contract.id)">{{ contract.contract_no }}</Link>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ contract.property?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ contract.tenant?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ contract.consultant?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ contract.start_date }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ contract.end_date }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ contract.monthly_rent }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span :class="[statusColors[contract.status] || 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">
                  {{ statusLabels[contract.status] || contract.status }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm space-x-2">
                <Link :href="route('contracts.show', contract.id)" class="text-blue-600 hover:text-blue-900">查看</Link>
                <Link :href="route('contracts.edit', contract.id)" class="text-blue-600 hover:text-blue-900">编辑</Link>
                <Link :href="route('contracts.history', contract.id)" class="text-blue-600 hover:text-blue-900">历史</Link>
              </td>
            </tr>
            <tr v-if="contracts.data.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-sm text-gray-500">暂无合同数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="contracts.last_page > 1" class="flex items-center justify-between">
        <p class="text-sm text-gray-600">显示第 {{ contracts.from }} 至 {{ contracts.to }} 条，共 {{ contracts.total }} 条</p>
        <div class="flex space-x-1">
          <Link v-for="page in contracts.last_page" :key="page" :href="route('contracts.index', { ...filters, page })" :class="[page === contracts.current_page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', 'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium']">{{ page }}</Link>
        </div>
      </div>
    </div>
  </div>
</template>
