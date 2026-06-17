<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">居民议题</h1>
        <Link href="/issues/create" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">发起议题</Link>
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
              <option value="voting">投票中</option>
              <option value="assigned">已分派</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类别</label>
            <select v-model="form.category" class="border rounded-md px-3 py-2 text-sm">
              <option value="">全部</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发起人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">责任部门</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">投票数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">截止日期</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="issue in issues.data" :key="issue.id">
              <td class="px-6 py-4 text-sm text-gray-900">{{ issue.title }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ issue.category }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="statusBadgeClass(issue.status)" class="px-2 py-1 rounded-full text-xs font-medium">{{ statusLabel(issue.status) }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ issue.reporter?.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ issue.department?.name || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ issue.vote_count }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ issue.deadline }}</td>
              <td class="px-6 py-4 text-sm flex items-center gap-2">
                <Link :href="`/issues/${issue.id}`" class="text-indigo-600 hover:text-indigo-900">查看</Link>
                <button v-if="issue.status === 'voting'" @click="vote(issue.id)" class="text-green-600 hover:text-green-900">投票</button>
              </td>
            </tr>
            <tr v-if="issues.data.length === 0">
              <td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, useForm, router, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()

const props = defineProps({
  issues: Object,
  categories: Array,
  filters: Object,
})

const canVote = computed(() => {
  const role = page.props.auth.user?.role
  return ['resident', 'representative'].includes(role)
})

const canCreate = computed(() => {
  const role = page.props.auth.user?.role
  return ['resident', 'representative', 'admin'].includes(role)
})

const form = useForm({
  start_date: props.filters?.start_date || '',
  end_date: props.filters?.end_date || '',
  status: props.filters?.status || '',
  category: props.filters?.category || '',
})

const search = () => {
  form.get('/issues', { preserveState: true, preserveScroll: true })
}

const vote = (issueId) => {
  router.post(`/issues/${issueId}/vote`, {}, { preserveScroll: true })
}

const statusLabel = (status) => {
  const map = { voting: '投票中', assigned: '已分派', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[status] || status
}

const statusBadgeClass = (status) => {
  const map = {
    voting: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-purple-100 text-purple-800',
    processing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}
</script>
