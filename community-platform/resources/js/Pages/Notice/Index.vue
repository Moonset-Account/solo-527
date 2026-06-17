<template>
  <MainLayout>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">结果公示</h1>

      <div class="bg-white rounded-lg shadow p-4">
        <form @submit.prevent="search" class="flex flex-wrap gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select v-model="form.type" class="border rounded-md px-3 py-2 text-sm">
              <option value="">全部</option>
              <option v-for="t in types" :key="t" :value="t">{{ typeLabel(t) }}</option>
            </select>
          </div>
          <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm">查询</button>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发布人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发布日期</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="notice in notices.data" :key="notice.id">
              <td class="px-6 py-4 text-sm text-gray-900">{{ notice.title }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ typeLabel(notice.type) }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ notice.publisher?.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ notice.published_at }}</td>
              <td class="px-6 py-4 text-sm">
                <Link :href="`/notices/${notice.id}`" class="text-indigo-600 hover:text-indigo-900">查看</Link>
              </td>
            </tr>
            <tr v-if="notices.data.length === 0">
              <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, useForm } from '@inertiajs/vue3'

const props = defineProps({
  notices: Object,
  filters: Object,
})

const types = ['grid_event', 'assistance', 'issue']

const form = useForm({
  type: props.filters?.type || '',
})

const search = () => {
  form.get('/notices', { preserveState: true, preserveScroll: true })
}

const typeLabel = (type) => {
  const map = {
    grid_event: '网格事件',
    assistance: '帮扶',
    issue: '议题',
  }
  return map[type] || type
}
</script>
