<script setup>
import { Link, router } from '@inertiajs/vue3'


const props = defineProps({
  bills: Object,
  filters: Object,
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待付' },
  { value: 'paid', label: '已付' },
  { value: 'overdue', label: '逾期' },
]

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'rent', label: '租金' },
  { value: 'deposit', label: '押金' },
  { value: 'management_fee', label: '管理费' },
  { value: 'other', label: '其他' },
]

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
}

const statusLabels = {
  pending: '待付',
  paid: '已付',
  overdue: '逾期',
}

function applyFilter() {
  router.get(route('bills.index'), props.filters, { preserveState: true, preserveScroll: true })
}

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
        <h1 class="text-2xl font-bold text-gray-900">账单管理</h1>
        <Link :href="route('bills.overdue')" class="inline-flex items-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          逾期账单
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
            <label class="block text-xs font-medium text-gray-500 mb-1">合同ID</label>
            <input v-model="filters.contract_id" @keyup.enter="applyFilter" type="number" placeholder="合同ID" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">到期日期（从）</label>
            <input v-model="filters.date_from" @change="applyFilter" type="date" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">到期日期（至）</label>
            <input v-model="filters.date_to" @change="applyFilter" type="date" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">类型</label>
            <select v-model="filters.type" @change="applyFilter" class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">账单编号</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">合同</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">物业</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">类型</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">金额</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">到期日</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">付款日</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="bill in bills.data" :key="bill.id" class="hover:bg-gray-50 transition-colors">
              <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600">
                <Link :href="route('bills.show', bill.id)">{{ bill.bill_no }}</Link>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.contract?.contract_no || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.contract?.property?.name || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.type }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">¥{{ bill.amount }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.due_date }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ bill.paid_date || '-' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span :class="[statusColors[bill.status] || 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ statusLabels[bill.status] || bill.status }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm space-x-2">
                <Link :href="route('bills.show', bill.id)" class="text-blue-600 hover:text-blue-900">查看</Link>
                <button v-if="bill.status === 'pending'" @click="markAsPaid(bill.id)" class="text-green-600 hover:text-green-900">标记已付</button>
              </td>
            </tr>
            <tr v-if="bills.data.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-sm text-gray-500">暂无账单数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="bills.last_page > 1" class="flex items-center justify-between">
        <p class="text-sm text-gray-600">显示第 {{ bills.from }} 至 {{ bills.to }} 条，共 {{ bills.total }} 条</p>
        <div class="flex space-x-1">
          <Link v-for="page in bills.last_page" :key="page" :href="route('bills.index', { ...filters, page })" :class="[page === bills.current_page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', 'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium']">{{ page }}</Link>
        </div>
      </div>
    </div>
  </div>
</template>
