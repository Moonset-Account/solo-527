<template>
  <div class="space-y-6">
    <section class="bg-white rounded-xl shadow-sm border p-6">
      <h2 class="text-lg font-semibold mb-4">🏠 居民查询 · 凭手机号查询参与过的议题并下载</h2>
      <div class="grid md:grid-cols-4 gap-3 items-end">
        <div class="md:col-span-2">
          <label class="text-sm text-gray-600">手机号 *</label>
          <input v-model="phone" placeholder="请输入反映时/投票时登记的手机号" class="w-full mt-1 px-3 py-2 border rounded" />
        </div>
        <div>
          <label class="text-sm text-gray-600">关键词</label>
          <input v-model="keyword" placeholder="编号/标题" class="w-full mt-1 px-3 py-2 border rounded" />
        </div>
        <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700" @click="loadList">查询</button>
      </div>
      <p class="mt-2 text-xs text-gray-500">说明：可查询到所有已公示的、及您作为反映人登记过的议题，点击卡片进入详情或直接下载单据</p>
    </section>

    <section v-if="rows.length || loaded" class="bg-white rounded-xl shadow-sm border p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold">查询结果（共 {{ total }} 条）</h3>
        <span class="text-xs text-gray-500">每页 {{ size }} 条</span>
      </div>
      <div class="space-y-3">
        <div v-for="i in rows" :key="i.id" class="p-4 border rounded-xl hover:shadow-sm transition">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono text-xs text-primary-600">{{ i.code }}</span>
                <span :class="'px-2 py-0.5 rounded text-xs font-medium ' + STATUS_COLORS[i.status]">{{ STATUS_LABELS[i.status] }}</span>
                <span class="text-xs text-gray-500">{{ i.category }}</span>
                <span class="text-xs text-gray-500">{{ fmtDateTime(i.createdAt) }}</span>
              </div>
              <NuxtLink :to="`/issue/${i.id}`" class="mt-1.5 font-medium hover:text-primary-700 block">{{ i.title }}</NuxtLink>
              <p class="mt-1 text-sm text-gray-600 line-clamp-2">{{ i.description }}</p>
              <div class="mt-2 flex items-center gap-3 flex-wrap text-xs text-gray-500">
                <span v-if="i.community">社区：{{ i.community }}</span>
                <span v-if="i.gridNo">网格：{{ i.gridNo }}</span>
                <span v-if="i._count?.votes">🗳️ {{ i._count.votes }} 票</span>
                <span v-if="i._count?.rectifications">🔧 整改 {{ i._count.rectifications }} 条</span>
                <span v-if="i._count?.reviews">✅ 复查 {{ i._count.reviews }} 次</span>
              </div>
            </div>
            <div class="flex flex-col gap-2 items-end">
              <div v-if="i.photos?.[0]" class="w-20 h-20 rounded overflow-hidden border">
                <img :src="i.photos[0].url" class="w-full h-full object-cover" />
              </div>
              <div class="flex items-center gap-2">
                <NuxtLink :to="`/issue/${i.id}`" class="text-xs px-3 py-1.5 border rounded hover:bg-gray-50">查看详情</NuxtLink>
                <a :href="`/api/issues/${i.id}/export-xlsx`" target="_blank" class="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700">📄 下载单据</a>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!rows.length && loaded" class="text-center py-12 text-sm text-gray-400">未找到相关议题，请确认手机号是否正确</div>
      </div>
      <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div></div>
        <div class="flex items-center gap-1">
          <button :disabled="page <= 1" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(-1)">上一页</button>
          <span>{{ page }} / {{ Math.max(1, Math.ceil(total / size)) }}</span>
          <button :disabled="page * size >= total" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(1)">下一页</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Issue, PageResult } from '~/types'
useHead({ title: '居民查询 - 居民议题闭环看板' })
const phone = ref('')
const keyword = ref('')
const page = ref(1)
const size = 20
const total = ref(0)
const rows = ref<Issue[]>([])
const loaded = ref(false)
const loadList = async () => {
  if (!phone.value) return alert('请输入手机号')
  const q = new URLSearchParams()
  q.set('phone', phone.value)
  q.set('page', String(page.value))
  q.set('size', String(size))
  if (keyword.value) q.set('keyword', keyword.value)
  const res = await request<PageResult<Issue>>(`/public/issues?${q.toString()}`)
  rows.value = res.rows
  total.value = res.total
  loaded.value = true
}
const changePage = (d: number) => { page.value = Math.max(1, page.value + d); loadList() }
</script>
