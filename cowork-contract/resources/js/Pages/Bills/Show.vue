<script setup>
import { Link, router } from '@inertiajs/vue3'


const props = defineProps({
  bill: Object,
})

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

function markAsPaid() {
  if (confirm('确认标记此账单为已付？')) {
    router.put(route('bills.pay', props.bill.id))
  }
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <Link :href="route('bills.index')" class="text-gray-500 hover:text-gray-700">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 class="text-2xl font-bold text-gray-900">账单详情</h1>
          <span :class="[statusColors[bill.status] || 'bg-gray-100 text-gray-800', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium']">{{ statusLabels[bill.status] || bill.status }}</span>
        </div>
        <button v-if="bill.status === 'pending'" @click="markAsPaid" class="inline-flex items-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors">标记已付</button>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg bg-white p-6 shadow">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">账单信息</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">账单编号</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.bill_no }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">类型</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.type }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">金额</dt>
              <dd class="text-sm font-medium text-gray-900">¥{{ bill.amount }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">状态</dt>
              <dd class="text-sm font-medium text-gray-900">{{ statusLabels[bill.status] || bill.status }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">到期日</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.due_date }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">付款日</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.paid_date || '-' }}</dd>
            </div>
            <div v-if="bill.period_start" class="flex justify-between">
              <dt class="text-sm text-gray-500">账单周期</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.period_start }} 至 {{ bill.period_end }}</dd>
            </div>
            <div v-if="bill.remark" class="flex justify-between">
              <dt class="text-sm text-gray-500">备注</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.remark }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg bg-white p-6 shadow">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">关联合同/物业</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">合同编号</dt>
              <dd class="text-sm font-medium text-blue-600">
                <Link v-if="bill.contract" :href="route('contracts.show', bill.contract.id)">{{ bill.contract.contract_no }}</Link>
                <span v-else>-</span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">租户</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.contract?.tenant?.name || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">物业名称</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.contract?.property?.name || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">物业地址</dt>
              <dd class="text-sm font-medium text-gray-900">{{ bill.contract?.property?.address || '-' }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
