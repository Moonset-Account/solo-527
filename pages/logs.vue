<template>
  <div class="space-y-6">
    <section class="bg-white rounded-xl shadow-sm border p-5">
      <h2 class="text-lg font-semibold mb-4">🔎 接口异常日志 · 可定位到单据、时间与失败原因</h2>
      <div class="grid md:grid-cols-4 gap-3">
        <input v-model="filters.issueCode" placeholder="单据编号（如YTxxxx）" class="px-3 py-2 border rounded" />
        <input v-model="filters.traceId" placeholder="Trace ID" class="px-3 py-2 border rounded" />
        <select v-model="filters.status" class="px-3 py-2 border rounded">
          <option value="">全部HTTP状态</option>
          <option value="400">400 参数错误</option>
          <option value="404">404 未找到</option>
          <option value="500">500 服务器错误</option>
        </select>
        <input v-model="filters.date" type="date" class="px-3 py-2 border rounded" />
      </div>
      <div class="mt-3 flex items-center justify-between">
        <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm" @click="load">查询</button>
        <span class="text-xs text-gray-500">共 {{ total }} 条 · 当前返回 {{ rows.length }} 条</span>
      </div>
    </section>

    <section class="bg-white rounded-xl shadow-sm border p-5">
      <div v-if="rows.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50"><tr class="text-left">
            <th class="p-3">时间</th>
            <th class="p-3">Trace ID</th>
            <th class="p-3">单据</th>
            <th class="p-3">请求</th>
            <th class="p-3">状态</th>
            <th class="p-3">错误码</th>
            <th class="p-3">失败原因</th>
            <th class="p-3"></th>
          </tr></thead>
          <tbody>
            <tr v-for="e in rows" :key="e.id" class="border-t hover:bg-gray-50">
              <td class="p-3 text-gray-500 text-xs whitespace-nowrap">{{ fmtDateTime(e.happenedAt) }}</td>
              <td class="p-3"><span class="font-mono text-xs text-primary-600">{{ e.traceId }}</span></td>
              <td class="p-3">
                <span v-if="e.issueCode" class="font-mono text-xs">{{ e.issueCode }}</span>
                <span v-else class="text-gray-300">-</span>
              </td>
              <td class="p-3">
                <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 mr-1">{{ e.method }}</span>
                <span class="text-xs text-gray-600">{{ e.path }}</span>
              </td>
              <td class="p-3">
                <span :class="'text-xs px-2 py-0.5 rounded font-medium ' + statusColor(e.status)">{{ e.status }}</span>
              </td>
              <td class="p-3 text-xs text-gray-600">{{ e.errorCode || '-' }}</td>
              <td class="p-3 text-xs text-red-600 max-w-md truncate" :title="e.message">{{ e.message }}</td>
              <td class="p-3">
                <button class="text-xs text-primary-600 hover:underline" @click="detail = e">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-center py-12 text-sm text-gray-400">暂无异常日志</div>
      <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div></div>
        <div class="flex items-center gap-1">
          <button :disabled="page <= 1" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(-1)">上一页</button>
          <span>{{ page }} / {{ Math.max(1, Math.ceil(total / size)) }}</span>
          <button :disabled="page * size >= total" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(1)">下一页</button>
        </div>
      </div>
    </section>

    <div v-if="detail" class="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" @click.self="detail = null">
      <div class="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-semibold mb-4">异常详情 <span class="text-sm font-mono text-primary-600 ml-2">{{ detail.traceId }}</span></h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500">发生时间：</span>{{ fmtDateTime(detail.happenedAt) }}</div>
          <div><span class="text-gray-500">关联单据：</span><span v-if="detail.issueCode" class="font-mono">{{ detail.issueCode }}</span><span v-else>-</span></div>
          <div><span class="text-gray-500">请求：</span><span class="font-mono text-xs">{{ detail.method }} {{ detail.path }}</span></div>
          <div><span class="text-gray-500">HTTP状态：</span><span :class="statusColor(detail.status) + ' px-2 py-0.5 rounded text-xs'">{{ detail.status }}</span></div>
          <div class="col-span-2"><span class="text-gray-500">业务错误码：</span>{{ detail.errorCode || '-' }}</div>
        </div>
        <div class="mt-4">
          <div class="text-sm text-gray-500 mb-1">失败原因：</div>
          <pre class="p-3 bg-red-50 text-red-700 text-xs rounded whitespace-pre-wrap break-all">{{ detail.message }}</pre>
        </div>
        <div v-if="detail.stack" class="mt-3">
          <div class="text-sm text-gray-500 mb-1">调用栈：</div>
          <pre class="p-3 bg-gray-50 text-xs rounded whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{{ detail.stack }}</pre>
        </div>
        <div v-if="detail.requestBody" class="mt-3">
          <div class="text-sm text-gray-500 mb-1">请求体：</div>
          <pre class="p-3 bg-gray-50 text-xs rounded whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{{ detail.requestBody }}</pre>
        </div>
        <div class="mt-5 flex justify-end">
          <button class="px-4 py-2 border rounded hover:bg-gray-50" @click="detail = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiException, PageResult } from '~/types'
useHead({ title: '异常日志 - 居民议题闭环看板' })
const filters = reactive({ issueCode: '', traceId: '', status: '', date: '' })
const page = ref(1)
const size = 50
const total = ref(0)
const rows = ref<ApiException[]>([])
const detail = ref<ApiException | null>(null)
const statusColor = (s: number) => s >= 500 ? 'bg-red-100 text-red-700' : s >= 400 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
const load = async () => {
  const q = new URLSearchParams()
  q.set('page', String(page.value))
  q.set('size', String(size))
  Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v) })
  const res = await request<PageResult<ApiException>>(`/exceptions?${q.toString()}`)
  rows.value = res.rows
  total.value = res.total
}
const changePage = (d: number) => { page.value = Math.max(1, page.value + d); load() }
await load()
</script>
