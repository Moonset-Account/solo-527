<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <Link href="/issues" class="text-gray-500 hover:text-gray-700">&larr; 返回列表</Link>
        <h1 class="text-2xl font-bold text-gray-900">议题详情</h1>
      </div>

      <div class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm font-medium text-gray-500">标题</span>
            <p class="mt-1 text-gray-900">{{ issue.title }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">状态</span>
            <p class="mt-1">
              <span :class="statusBadgeClass(issue.status)" class="px-2 py-1 rounded-full text-xs font-medium">{{ statusLabel(issue.status) }}</span>
            </p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">类别</span>
            <p class="mt-1 text-gray-900">{{ issue.category }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">发起人</span>
            <p class="mt-1 text-gray-900">{{ issue.reporter?.name }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">责任部门</span>
            <p class="mt-1 text-gray-900">{{ issue.department?.name || '-' }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">截止日期</span>
            <p class="mt-1 text-gray-900">{{ issue.deadline || '-' }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">投票数</span>
            <p class="mt-1 text-gray-900">{{ issue.votes_count || 0 }}</p>
          </div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500">描述</span>
          <p class="mt-1 text-gray-900">{{ issue.description }}</p>
        </div>
      </div>

      <div v-if="canVote" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">投票</h2>
        <button @click="vote" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 text-sm" :disabled="voting">赞同投票</button>
      </div>

      <div v-if="canAssign" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">分派责任部门</h2>
        <form @submit.prevent="assign" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">责任部门</label>
            <select v-model="assignForm.department_id" class="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">请选择</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <input v-model="assignForm.deadline" type="date" class="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div class="flex justify-end">
            <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 text-sm" :disabled="assignForm.processing">分派</button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, router, useForm, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'

const page = usePage()

const props = defineProps({
  issue: Object,
  departments: Array,
})

const voting = ref(false)

const canVote = computed(() => {
  const role = page.props.auth.user?.role
  const allowedRoles = ['resident', 'representative']
  return props.issue.status === 'voting' && allowedRoles.includes(role)
})

const canAssign = computed(() => {
  const role = page.props.auth.user?.role
  const isAssigned = props.issue.department_id !== null
  return role === 'admin' && !isAssigned
})

const vote = () => {
  voting.value = true
  router.post(`/issues/${props.issue.id}/vote`, {}, {
    preserveScroll: true,
    onFinish: () => { voting.value = false },
  })
}

const assignForm = useForm({
  department_id: '',
  deadline: '',
})

const assign = () => {
  assignForm.post(`/issues/${props.issue.id}/assign`, {
    preserveScroll: true,
  })
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
