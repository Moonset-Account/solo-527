<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">网格事件台</h1>
        <Link v-if="canCreate" href="/grid-events/create" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">新增事件</Link>
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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select v-model="form.status" class="border rounded-md px-3 py-2 text-sm">
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">处理人</label>
            <select v-model="form.handler_id" class="border rounded-md px-3 py-2 text-sm">
              <option value="">全部</option>
              <option v-for="handler in handlers" :key="handler.id" :value="handler.id">{{ handler.name }}</option>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">上报人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">处理人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">事件时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="event in gridEvents.data" :key="event.id">
              <td class="px-6 py-4 text-sm text-gray-900">{{ event.title }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ event.location }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="statusBadgeClass(event.status)" class="px-2 py-1 rounded-full text-xs font-medium">{{ statusLabel(event.status) }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ event.reporter?.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ event.handler?.name || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ event.event_time }}</td>
              <td class="px-6 py-4 text-sm">
                <Link :href="`/grid-events/${event.id}`" class="text-indigo-600 hover:text-indigo-900">查看</Link>
              </td>
            </tr>
            <tr v-if="gridEvents.data.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, useForm, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()

const props = defineProps({
  gridEvents: Object,
  handlers: Array,
  filters: Object,
})

const canCreate = computed(() => {
  const role = page.props.auth.user?.role
  return ['resident', 'representative', 'admin'].includes(role)
})

const form = useForm({
  start_date: props.filters?.start_date || '',
  end_date: props.filters?.end_date || '',
  status: props.filters?.status || '',
  handler_id: props.filters?.handler_id || '',
})

const search = () => {
  form.get('/grid-events', { preserveState: true, preserveScroll: true })
}

const statusLabel = (status) => {
  const map = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[status] || status
}

const statusBadgeClass = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}
</script>
