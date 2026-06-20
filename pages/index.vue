<template>
  <div class="space-y-6">
    <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-5 shadow">
        <div class="text-sm opacity-80">议题总数</div>
        <div class="text-3xl font-bold mt-1">{{ summary?.total ?? 0 }}</div>
      </div>
      <div class="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl p-5 shadow">
        <div class="text-sm opacity-80">整改中/投票中</div>
        <div class="text-3xl font-bold mt-1">{{ (summary?.statusCount?.RECTIFYING || 0) + (summary?.statusCount?.VOTING || 0) }}</div>
      </div>
      <div class="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-5 shadow">
        <div class="text-sm opacity-80">已闭环</div>
        <div class="text-3xl font-bold mt-1">{{ summary?.statusCount?.DONE || 0 }}</div>
      </div>
      <div class="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl p-5 shadow">
        <div class="text-sm opacity-80">超时待办</div>
        <div class="text-3xl font-bold mt-1">{{ summary?.timeoutRect ?? 0 }}</div>
      </div>
    </section>

    <section class="bg-white rounded-xl shadow-sm border p-5">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <span>📋 结果公示 / 议题列表</span>
          <span class="text-xs text-gray-400 font-normal">已公示的议题可公开查询</span>
        </h2>
        <div class="flex items-center gap-2">
          <input v-model="filters.keyword" placeholder="搜索关键词/编号" class="px-3 py-1.5 text-sm border rounded w-52" @keyup.enter="loadIssues" />
          <select v-model="filters.status" class="px-3 py-1.5 text-sm border rounded">
            <option value="">全部状态</option>
            <option v-for="(v,k) in STATUS_LABELS" :key="k" :value="k">{{ v }}</option>
          </select>
          <select v-model="filters.category" class="px-3 py-1.5 text-sm border rounded w-32">
            <option value="">全部分类</option>
            <option v-for="c in categoryList" :key="c" :value="c">{{ c }}</option>
          </select>
          <button class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700" @click="loadIssues">筛选</button>
        </div>
      </div>
      <div class="mt-4 space-y-3">
        <IssueCard v-for="i in rows" :key="i.id" :issue="i" :show-photos="true" @preview="previewUrl = $event" />
        <div v-if="!rows.length" class="text-center py-12 text-sm text-gray-400">暂无议题</div>
      </div>
      <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>共 {{ total }} 条</span>
        <div class="flex items-center gap-1">
          <button :disabled="page <= 1" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(-1)">上一页</button>
          <span>{{ page }} / {{ Math.max(1, Math.ceil(total / size)) }}</span>
          <button :disabled="page * size >= total" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(1)">下一页</button>
        </div>
      </div>
    </section>

    <div v-if="previewUrl" class="fixed inset-0 bg-black/80 z-50 grid place-items-center p-4 cursor-zoom-out" @click.self="previewUrl = null">
      <img :src="previewUrl" class="max-w-full max-h-[90vh] rounded-lg" @click.stop />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Issue, PageResult } from '~/types'
useHead({ title: '议题公示 - 居民议题闭环看板' })
const filters = reactive({ keyword: '', status: '', category: '' })
const page = ref(1)
const size = 20
const total = ref(0)
const rows = ref<Issue[]>([])
const previewUrl = ref('')
const summary = ref<any>(null)
const categoryList = ref<string[]>(['环境卫生', '公共设施', '治安巡逻', '绿化养护', '邻里纠纷', '其他'])

const loadSummary = async () => {
  try { summary.value = await request<any>('/stats/summary') } catch (e) {}
  if (summary.value?.categoryCount) {
    categoryList.value = Array.from(new Set([...summary.value.categoryCount.map((c: any) => c.category), ...categoryList.value]))
  }
}
const loadIssues = async () => {
  const q = new URLSearchParams()
  q.set('page', String(page.value))
  q.set('size', String(size))
  if (filters.keyword) q.set('keyword', filters.keyword)
  if (filters.status) q.set('status', filters.status)
  if (filters.category) q.set('category', filters.category)
  q.set('published', '1')
  const res = await request<PageResult<Issue>>(`/public/issues?${q.toString()}`)
  rows.value = res.rows
  total.value = res.total
}
const changePage = (d: number) => {
  page.value = Math.max(1, page.value + d)
  loadIssues()
}
await loadSummary()
await loadIssues()
</script>
