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
            <p class="mt-1 text-gray-900">{{ issue.deadline }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">投票数</span>
            <p class="mt-1 text-gray-900">{{ issue.vote_count }}</p>
          </div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500">描述</span>
          <p class="mt-1 text-gray-900">{{ issue.description }}</p>
        </div>
      </div>

      <div v-if="issue.status === 'voting'" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">投票</h2>
        <button @click="vote" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 text-sm" :disabled="voting">赞同投票</button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, router } from '@inertiajs/vue3'
import { ref } from 'vue'

const props = defineProps({
  issue: Object,
})

const voting = ref(false)

const vote = () => {
  voting.value = true
  router.post(`/issues/${props.issue.id}/vote`, {}, {
    preserveScroll: true,
    onFinish: () => { voting.value = false },
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
