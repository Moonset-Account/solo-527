<script setup>
import { Link } from '@inertiajs/vue3'


const props = defineProps({
  contract: Object,
  logs: Object,
})

const statusLabels = {
  draft: '草稿',
  pending_approval: '待审批',
  active: '生效中',
  expired: '已过期',
  terminated: '已终止',
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <Link :href="route('contracts.show', contract.id)" class="text-gray-500 hover:text-gray-700">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 class="text-2xl font-bold text-gray-900">操作历史</h1>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">合同摘要</h3>
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt class="text-xs text-gray-500">合同编号</dt>
            <dd class="text-sm font-medium text-gray-900">{{ contract.contract_no }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">物业</dt>
            <dd class="text-sm font-medium text-gray-900">{{ contract.property?.name || '-' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">租户</dt>
            <dd class="text-sm font-medium text-gray-900">{{ contract.tenant?.name || '-' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">状态</dt>
            <dd class="text-sm font-medium text-gray-900">{{ statusLabels[contract.status] || contract.status }}</dd>
          </div>
        </dl>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作人</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">时间</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">详情</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="log in logs.data" :key="log.id" class="hover:bg-gray-50 transition-colors">
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ log.user?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">{{ log.action }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ log.created_at }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">
                <pre v-if="log.payload" class="whitespace-pre-wrap text-xs bg-gray-50 rounded p-2 max-w-md overflow-auto">{{ JSON.stringify(log.payload, null, 2) }}</pre>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="logs.data.length === 0">
              <td colspan="4" class="px-4 py-8 text-center text-sm text-gray-500">暂无操作记录</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="logs.last_page > 1" class="flex items-center justify-between">
        <p class="text-sm text-gray-600">显示第 {{ logs.from }} 至 {{ logs.to }} 条，共 {{ logs.total }} 条</p>
        <div class="flex space-x-1">
          <Link v-for="page in logs.last_page" :key="page" :href="route('contracts.history', { ...contract, page })" :class="[page === logs.current_page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', 'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium']">{{ page }}</Link>
        </div>
      </div>
    </div>
  </div>
</template>
