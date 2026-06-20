<script setup>
import { Link, router } from '@inertiajs/vue3'
import { reactive } from 'vue'


const props = defineProps({
  contracts: Object,
})

const rejectReasons = reactive({})

function approve(contractId) {
  if (confirm('确认批准此合同？')) {
    router.put(route('reviews.review', contractId), { status: 'approved' })
  }
}

function reject(contractId) {
  const reason = rejectReasons[contractId]
  if (!reason || !reason.trim()) {
    alert('请填写驳回原因')
    return
  }
  router.put(route('reviews.review', contractId), {
    status: 'rejected',
    reject_reason: reason,
  })
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">合同审核</h1>
        <span class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-800">{{ contracts.total }} 笔待审核</span>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">合同编号</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">物业</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">租户</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">招商顾问</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">月租金</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">起止日期</th>
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
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">¥{{ contract.monthly_rent }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ contract.start_date }} 至 {{ contract.end_date }}</td>
              <td class="px-4 py-3 text-sm">
                <div class="flex flex-col space-y-2">
                  <div class="flex space-x-2">
                    <button @click="approve(contract.id)" class="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">批准</button>
                    <button @click="reject(contract.id)" class="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors">驳回</button>
                  </div>
                  <input v-model="rejectReasons[contract.id]" type="text" placeholder="驳回原因（驳回时必填）" class="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-red-500 focus:ring-red-500" />
                </div>
              </td>
            </tr>
            <tr v-if="contracts.data.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">暂无待审核合同</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="contracts.last_page > 1" class="flex items-center justify-between">
        <p class="text-sm text-gray-600">显示第 {{ contracts.from }} 至 {{ contracts.to }} 条，共 {{ contracts.total }} 条</p>
        <div class="flex space-x-1">
          <Link v-for="page in contracts.last_page" :key="page" :href="route('reviews.pending', { page })" :class="[page === contracts.current_page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', 'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium']">{{ page }}</Link>
        </div>
      </div>
    </div>
  </div>
</template>
