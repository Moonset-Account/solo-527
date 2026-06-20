<template>
  <div class="space-y-6">
    <section class="bg-white rounded-xl shadow-sm border p-5">
      <h2 class="text-lg font-semibold mb-4">📊 统计巡检 · 巡逻覆盖 & 超时同步</h2>
      <div class="grid md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-xl p-4 shadow">
          <div class="text-sm opacity-80">议题总数</div>
          <div class="text-3xl font-bold mt-1">{{ summary?.total ?? 0 }}</div>
        </div>
        <div class="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow">
          <div class="text-sm opacity-80">已闭环</div>
          <div class="text-3xl font-bold mt-1">{{ summary?.statusCount?.DONE || 0 }}</div>
        </div>
        <div class="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl p-4 shadow">
          <div class="text-sm opacity-80">整改超时</div>
          <div class="text-3xl font-bold mt-1">{{ summary?.timeoutRect || 0 }}</div>
        </div>
        <div class="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-xl p-4 shadow">
          <div class="text-sm opacity-80">未完成待办</div>
          <div class="text-3xl font-bold mt-1">{{ summary?.openTodos || 0 }}</div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h4 class="text-sm font-semibold mb-3">按状态分布</h4>
          <div v-if="summary?.statusCount" class="space-y-2">
            <div v-for="(v,k) in summary.statusCount" :key="k" class="flex items-center gap-3">
              <span class="w-24 text-sm">{{ STATUS_LABELS[k] || k }}</span>
              <div class="flex-1 bg-gray-100 h-6 rounded overflow-hidden relative">
                <div class="h-full bg-primary-500" :style="{ width: pct(v, summary.total) + '%' }"></div>
                <span class="absolute inset-0 grid place-items-center text-xs font-medium text-gray-700">{{ v }}</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-3">Top 分类</h4>
          <div v-if="summary?.categoryCount?.length" class="space-y-2">
            <div v-for="c in summary.categoryCount.slice(0, 8)" :key="c.category" class="flex items-center gap-3">
              <span class="w-24 text-sm truncate">{{ c.category }}</span>
              <div class="flex-1 bg-gray-100 h-6 rounded overflow-hidden relative">
                <div class="h-full bg-emerald-500" :style="{ width: pct(c._count._all, summary.total) + '%' }"></div>
                <span class="absolute inset-0 grid place-items-center text-xs font-medium text-gray-700">{{ c._count._all }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-xl shadow-sm border p-5">
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 class="text-base font-semibold">🛡️ 巡逻覆盖统计（超时待办自动同步至此）</h3>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">起</label>
          <input v-model="range.start" type="date" class="px-2 py-1 border rounded text-sm" />
          <label class="text-sm text-gray-500">止</label>
          <input v-model="range.end" type="date" class="px-2 py-1 border rounded text-sm" />
          <input v-model="range.gridNo" placeholder="网格编号" class="px-2 py-1 border rounded text-sm w-32" />
          <button class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50" @click="loadPatrol">查询</button>
        </div>
      </div>
      <div class="overflow-x-auto border rounded-lg">
        <table class="w-full text-sm">
          <thead class="bg-gray-50"><tr class="text-left">
            <th class="p-3">日期</th>
            <th class="p-3">网格</th>
            <th class="p-3 text-right">巡逻次数</th>
            <th class="p-3 text-right">覆盖数</th>
            <th class="p-3 text-right">处置事件</th>
            <th class="p-3 text-right">超时待办(同步)</th>
            <th class="p-3">备注</th>
          </tr></thead>
          <tbody>
            <tr v-for="s in patrol" :key="s.id" class="border-t">
              <td class="p-3">{{ s.date.slice(0, 10) }}</td>
              <td class="p-3 text-gray-600">#{{ s.gridNo }}</td>
              <td class="p-3 text-right">{{ s.patrolCount }}</td>
              <td class="p-3 text-right"><span class="text-primary-600 font-medium">{{ s.coveredCount }}</span></td>
              <td class="p-3 text-right">{{ s.handledEventCount }}</td>
              <td class="p-3 text-right"><span class="text-orange-600 font-medium">{{ s.timeoutTodoCount }}</span></td>
              <td class="p-3 text-gray-500 text-xs">{{ s.note || '-' }}</td>
            </tr>
            <tr v-if="!patrol.length"><td colspan="7" class="p-10 text-center text-gray-400">暂无巡逻数据，处置网格事件时"计入巡逻覆盖"或扫描超时时会自动生成</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PatrolStat } from '~/types'
useHead({ title: '统计巡检 - 居民议题闭环看板' })
const summary = ref<any>(null)
const range = reactive({ start: '', end: '', gridNo: '' })
const patrol = ref<PatrolStat[]>([])
const pct = (v: number, t: number) => t ? Math.min(100, Math.round((v / t) * 100)) : 0
const loadSummary = async () => { summary.value = await request('/stats/summary') }
const loadPatrol = async () => {
  const q = new URLSearchParams()
  if (range.start) q.set('startDate', range.start)
  if (range.end) q.set('endDate', range.end)
  if (range.gridNo) q.set('gridNo', range.gridNo)
  patrol.value = await request<PatrolStat[]>(`/stats/patrol?${q.toString()}`)
}
await loadSummary()
await loadPatrol()
</script>
