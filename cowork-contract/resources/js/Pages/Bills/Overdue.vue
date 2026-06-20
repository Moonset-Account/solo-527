<script setup>
import { Link, router } from '@inertiajs/vue3'


const props = defineProps({
  bills: Object,
})

function markAsPaid(billId) {
  if (confirm('确认标记此账单为已付？')) {
    router.put(route('bills.pay', billId))
  }
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <h1 class="text-2xl font-bold text-gray-900">逾期账单</h1>
          <span class="inline-flex items-center rounded-full bg-red-100 px-3 py-0.5 text-sm font-medium text-red-800">{{ bills.total }} 笔逾期</span>
        </div>
        <Link :href="route('bills.index')" class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">返回账单列表</Link>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow">
        <div class="border-b border-red-200 bg-red-50 px-4 py-3">
          <div class="flex items-center">
            <svg class="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <span class="text-sm font-medium text-red-800">以下账单已超过到期日，请尽快处理</span>
          </div>
        </div>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">账单编号</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">合同</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">物业</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">租户</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">类型</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">金额</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">到期日</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">逾期天数</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="bill in bills.data" :key="bill.id" class="hover:bg-red-50 transition-colors">
              <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600">
                <Link :href="route('bills.show', bill.id)">{{ bill.bill_no }}</Link>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.contract?.contract_no || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.contract?.property?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.contract?.tenant?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.type }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">¥{{ bill.amount }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-red-600 font-medium">{{ bill.due_date }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {{ Math.ceil((new Date() - new Date(bill.due_date)) / (1000 * 60 * 60 * 24)) }} 天
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">逾期</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <button @click="markAsPaid(bill.id)" class="text-green-600 hover:text-green-900 font-medium">标记已付</button>
              </td>
            </tr>
            <tr v-if="bills.data.length === 0">
              <td colspan="10" class="px-4 py-8 text-center text-sm text-gray-500">暂无逾期账单</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="bills.last_page > 1" class="flex items-center justify-between">
        <p class="text-sm text-gray-600">显示第 {{ bills.from }} 至 {{ bills.to }} 条，共 {{ bills.total }} 条</p>
        <div class="flex space-x-1">
          <Link v-for="page in bills.last_page" :key="page" :href="route('bills.overdue', { page })" :class="[page === bills.current_page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', 'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium']">{{ page }}</Link>
        </div>
      </div>
    </div>
  </div>
</template>
