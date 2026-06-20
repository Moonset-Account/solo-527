<script setup>
import { Link, router } from '@inertiajs/vue3'
import { reactive } from 'vue'


const form = reactive({
  contract_no: '',
  property_id: '',
  tenant_id: '',
  consultant_id: '',
  start_date: '',
  end_date: '',
  monthly_rent: '',
  deposit_amount: '',
  payment_cycle: 'monthly',
  terms: '',
})

function submit() {
  router.post(route('contracts.store'), form)
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center space-x-3">
        <Link :href="route('contracts.index')" class="text-gray-500 hover:text-gray-700">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h1 class="text-2xl font-bold text-gray-900">新建合同</h1>
      </div>

      <form @submit.prevent="submit" class="rounded-lg bg-white p-6 shadow">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">合同编号 <span class="text-red-500">*</span></label>
            <input v-model="form.contract_no" type="text" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">物业ID <span class="text-red-500">*</span></label>
            <input v-model="form.property_id" type="number" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">租户ID <span class="text-red-500">*</span></label>
            <input v-model="form.tenant_id" type="number" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">招商顾问ID <span class="text-red-500">*</span></label>
            <input v-model="form.consultant_id" type="number" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始日期 <span class="text-red-500">*</span></label>
            <input v-model="form.start_date" type="date" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结束日期 <span class="text-red-500">*</span></label>
            <input v-model="form.end_date" type="date" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">月租金 <span class="text-red-500">*</span></label>
            <input v-model="form.monthly_rent" type="number" step="0.01" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">押金金额</label>
            <input v-model="form.deposit_amount" type="number" step="0.01" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">付款周期</label>
            <select v-model="form.payment_cycle" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="monthly">月付</option>
              <option value="quarterly">季付</option>
              <option value="semi_annually">半年付</option>
              <option value="annually">年付</option>
            </select>
          </div>
        </div>
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">合同条款</label>
          <textarea v-model="form.terms" rows="5" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <Link :href="route('contracts.index')" class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">取消</Link>
          <button type="submit" class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">提交</button>
        </div>
      </form>
    </div>
  </div>
</template>
