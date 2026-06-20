<script setup>
import { reactive } from 'vue'


const form = reactive({
  export_type: 'contracts',
  date_from: '',
  date_to: '',
  status: '',
  property_id: '',
})

const statusOptions = {
  contracts: [
    { value: '', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending_approval', label: '待审批' },
    { value: 'active', label: '生效中' },
    { value: 'expired', label: '已过期' },
    { value: 'terminated', label: '已终止' },
  ],
  bills: [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待付' },
    { value: 'paid', label: '已付' },
  ],
}

function submit() {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(form)) {
    if (value) params.append(key, value)
  }
  window.location.href = route('reports.export') + '?' + params.toString()
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">报表导出</h1>

      <form @submit.prevent="submit" class="rounded-lg bg-white p-6 shadow">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">导出类型 <span class="text-red-500">*</span></label>
            <select v-model="form.export_type" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="contracts">合同报表</option>
              <option value="bills">账单报表</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select v-model="form.status" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option v-for="opt in statusOptions[form.export_type]" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input v-model="form.date_from" type="date" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input v-model="form.date_to" type="date" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">物业ID</label>
            <input v-model="form.property_id" type="number" placeholder="筛选指定物业" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button type="submit" class="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
            <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            导出报表
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
