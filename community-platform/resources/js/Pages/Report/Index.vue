<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">居民参与报表</h1>
        <button @click="exportReport" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">导出CSV</button>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <form @submit.prevent="search" class="flex flex-wrap gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input v-model="form.start_date" type="date" class="border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input v-model="form.end_date" type="date" class="border rounded-md px-3 py-2 text-sm" />
          </div>
          <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm">查询</button>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">居民</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">事件数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">议题数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">投票数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">帮扶数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">待办数</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="stat in stats" :key="stat.user_id">
              <td class="px-6 py-4 text-sm text-gray-900">{{ stat.user_name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ stat.event_count }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ stat.issue_count }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ stat.vote_count }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ stat.assistance_count }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ stat.todo_count }}</td>
            </tr>
            <tr v-if="stats.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { useForm } from '@inertiajs/vue3'

const props = defineProps({
  stats: Array,
  filters: Object,
})

const form = useForm({
  start_date: props.filters?.start_date || '',
  end_date: props.filters?.end_date || '',
})

const search = () => {
  form.get('/reports', { preserveState: true, preserveScroll: true })
}

const exportReport = () => {
  const params = new URLSearchParams()
  if (form.start_date) params.set('start_date', form.start_date)
  if (form.end_date) params.set('end_date', form.end_date)
  window.location.href = `/reports/export?${params.toString()}`
}
</script>
