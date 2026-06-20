<template>
  <div class="space-y-6">
    <section class="bg-white rounded-xl shadow-sm border p-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-semibold">📌 待办中心</h2>
        <p class="text-xs text-gray-500 mt-1">处置超时形成的待办会自动同步到巡逻覆盖统计，减少口头确认</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50" @click="scanTimeout">🔍 扫描超时并生成待办</button>
        <select v-model="filter.done" class="px-3 py-1.5 text-sm border rounded" @change="load">
          <option value="">全部</option>
          <option value="0">未完成</option>
          <option value="1">已完成</option>
        </select>
        <select v-model="filter.fromTimeout" class="px-3 py-1.5 text-sm border rounded" @change="load">
          <option value="">全部来源</option>
          <option value="timeout">超时自动生成</option>
        </select>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm border p-5">
        <div class="text-sm text-gray-500">待办总数</div>
        <div class="text-3xl font-bold mt-2">{{ rows.length }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border p-5">
        <div class="text-sm text-gray-500">未完成</div>
        <div class="text-3xl font-bold mt-2 text-red-600">{{ pendingCount }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border p-5">
        <div class="text-sm text-gray-500">超时生成 / 已同步巡逻</div>
        <div class="text-3xl font-bold mt-2 text-primary-600">{{ timeoutCount }} / {{ syncedCount }}</div>
      </div>
    </section>

    <section class="bg-white rounded-xl shadow-sm border p-5">
      <div v-if="rows.length" class="divide-y">
        <div v-for="t in rows" :key="t.id" class="py-4 flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="'px-2 py-0.5 rounded text-xs font-medium ' + (t.done ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                {{ t.done ? '已完成' : '待处理' }}
              </span>
              <span v-if="t.fromTimeout" class="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">超时生成</span>
              <span class="text-xs text-gray-500">{{ t.type }}</span>
              <NuxtLink v-if="t.issue" :to="`/admin/issue/${t.issue.id}`" class="text-xs text-primary-600 hover:underline font-mono">{{ t.issue.code }}</NuxtLink>
            </div>
            <h4 class="mt-1.5 font-medium">{{ t.title }}</h4>
            <p v-if="t.description" class="mt-1 text-sm text-gray-600">{{ t.description }}</p>
            <div class="mt-2 text-xs text-gray-500 flex items-center gap-3 flex-wrap">
              <span v-if="t.assignee">负责人：{{ t.assignee }}</span>
              <span v-if="t.deadline">截止：{{ fmtDateTime(t.deadline) }}</span>
              <span>创建：{{ fmtDateTime(t.createdAt) }}</span>
              <span v-if="t.doneAt">完成：{{ fmtDateTime(t.doneAt) }}</span>
              <span v-if="t.patrolSynced" class="text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">✓ 已同步巡逻覆盖统计</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink v-if="t.issue" :to="`/admin/issue/${t.issue.id}`" class="text-xs px-3 py-1.5 border rounded hover:bg-gray-50">跳转处置</NuxtLink>
            <button v-if="!t.done" class="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700" @click="complete(t)">标记完成</button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-sm text-gray-400">暂无待办，点击"扫描超时"自动从处置超时时生成</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Todo } from '~/types'
useHead({ title: '待办中心 - 居民议题闭环看板' })
const { name } = useOperator()
const filter = reactive({ done: '' as string, fromTimeout: '' as string })
const rows = ref<Todo[]>([])
const pendingCount = computed(() => rows.value.filter(t => !t.done).length)
const timeoutCount = computed(() => rows.value.filter(t => t.fromTimeout).length)
const syncedCount = computed(() => rows.value.filter(t => t.patrolSynced).length)
const load = async () => {
  const q = new URLSearchParams()
  if (filter.done) q.set('done', filter.done)
  if (filter.fromTimeout === 'timeout') q.set('from', 'timeout')
  rows.value = await request<Todo[]>(`/todos?${q.toString()}`)
}
const scanTimeout = async () => {
  try {
    const r = await request<any>('/jobs/scan-timeout', { method: 'POST', body: {} })
    alert(`扫描完成：新增待办 ${r.createdTodos} 条，同步巡逻统计 ${r.syncedPatrol} 条`)
  } catch (e) {}
  await load()
}
const complete = async (t: Todo) => {
  await request(`/todos/${t.id}/complete`, { method: 'POST', body: { operator: name } })
  await load()
}
await load()
</script>
