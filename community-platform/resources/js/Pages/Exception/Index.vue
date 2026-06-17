<template>
  <MainLayout>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">异常列表</h1>

      <div class="bg-white rounded-lg shadow p-4">
        <form @submit.prevent="search" class="flex flex-wrap gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select v-model="form.type" class="border rounded-md px-3 py-2 text-sm">
              <option value="">全部</option>
              <option value="notification">通知</option>
              <option value="payment">支付</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select v-model="form.status" class="border rounded-md px-3 py-2 text-sm">
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="resolved">已解决</option>
            </select>
          </div>
          <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm">查询</button>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">错误信息</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">重试次数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发生时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="exception in exceptions.data" :key="exception.id">
              <td class="px-6 py-4 text-sm text-gray-900">{{ typeLabel(exception.type) }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{{ exception.error_message }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="exception.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ exception.status === 'resolved' ? '已解决' : '待处理' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ exception.retry_count }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ exception.created_at }}</td>
              <td class="px-6 py-4 text-sm flex items-center gap-2">
                <button v-if="exception.status !== 'resolved'" @click="resolveException(exception.id)" class="text-green-600 hover:text-green-900">解决</button>
                <button v-if="exception.status !== 'resolved'" @click="retryException(exception.id)" class="text-blue-600 hover:text-blue-900">重试</button>
              </td>
            </tr>
            <tr v-if="exceptions.data.length === 0">
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
import { useForm, router } from '@inertiajs/vue3'

const props = defineProps({
  exceptions: Object,
  filters: Object,
})

const form = useForm({
  type: props.filters?.type || '',
  status: props.filters?.status || '',
})

const search = () => {
  form.get('/exceptions', { preserveState: true, preserveScroll: true })
}

const resolveException = (id) => {
  router.post(`/exceptions/${id}/resolve`, {}, { preserveScroll: true })
}

const retryException = (id) => {
  router.post(`/exceptions/${id}/retry`, {}, { preserveScroll: true })
}

const typeLabel = (type) => {
  const map = { notification: '通知', payment: '支付' }
  return map[type] || type
}
</script>
