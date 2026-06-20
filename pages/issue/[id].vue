<template>
  <div v-if="issue" class="space-y-6">
    <nav class="text-sm text-gray-500">
      <NuxtLink to="/" class="hover:underline">首页</NuxtLink>
      <span class="mx-2">/</span>
      <span class="text-gray-800">{{ issue.code }}</span>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section class="bg-white rounded-xl shadow-sm border p-6">
          <IssueCard :issue="issue" :show-photos="false" hide-code-link hide-title @preview="previewUrl = $event" />
          <h1 class="mt-4 text-2xl font-bold text-gray-900">{{ issue.title }}</h1>
          <p class="mt-3 text-gray-700 whitespace-pre-wrap leading-relaxed">{{ issue.description }}</p>
          <PhotoGrid v-if="issue.photos?.length" class="mt-4" :photos="issue.photos" title="📷 问题现场/设施照片" @preview="previewUrl = $event" />
        </section>

        <section class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">🗳️ 居民投票</h3>
            <div v-if="issue.voteEndAt" class="text-xs text-gray-500">截止：{{ fmtDateTime(issue.voteEndAt) }}</div>
          </div>
          <div v-if="issue.votes?.length" class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="p-3 bg-green-50 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-600">{{ count('AGREE') }}</div>
                <div class="text-xs text-gray-500 mt-0.5">赞成 {{ pct('AGREE') }}%</div>
              </div>
              <div class="p-3 bg-red-50 rounded-lg text-center">
                <div class="text-2xl font-bold text-red-600">{{ count('DISAGREE') }}</div>
                <div class="text-xs text-gray-500 mt-0.5">反对 {{ pct('DISAGREE') }}%</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg text-center">
                <div class="text-2xl font-bold text-gray-600">{{ count('ABSTAIN') }}</div>
                <div class="text-xs text-gray-500 mt-0.5">弃权 {{ pct('ABSTAIN') }}%</div>
              </div>
            </div>
            <div class="mt-4 max-h-64 overflow-y-auto border rounded">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0"><tr class="text-left">
                  <th class="p-2">时间</th><th class="p-2">居民</th><th class="p-2">意见</th><th class="p-2">备注</th>
                </tr></thead>
                <tbody>
                  <tr v-for="v in issue.votes" :key="v.id" class="border-t">
                    <td class="p-2 text-gray-500">{{ fmtDateTime(v.createdAt) }}</td>
                    <td class="p-2">{{ v.resident?.name }}<span class="text-xs text-gray-400 ml-1">{{ v.resident?.phone }}</span></td>
                    <td class="p-2"><span :class="optColor(v.option)">{{ optLabel(v.option) }}</span></td>
                    <td class="p-2 text-gray-600">{{ v.comment || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="text-center py-8 text-sm text-gray-400">暂无投票</div>
        </section>

        <section v-if="issue.gridEvents?.length" class="bg-white rounded-xl shadow-sm border p-6">
          <h3 class="text-lg font-semibold mb-4">📡 关联网格事件</h3>
          <div class="space-y-3">
            <div v-for="g in issue.gridEvents" :key="g.id" class="p-3 border rounded-lg">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-xs font-medium" :class="g.handled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">{{ g.handled ? '已处置' : '待处置' }}</span>
                  <span class="text-sm font-medium">{{ g.eventType }}</span>
                  <span class="text-xs text-gray-500">网格#{{ g.gridNo }}</span>
                </div>
                <div class="text-xs text-gray-400">{{ fmtDateTime(g.occurredAt) }}</div>
              </div>
              <p class="mt-2 text-sm text-gray-600">{{ g.description }}</p>
              <div class="mt-2 text-xs text-gray-500 flex items-center gap-3">
                <span>处置人：{{ g.handler || '-' }}</span>
                <span v-if="g.handledAt">处置时间：{{ fmtDateTime(g.handledAt) }}</span>
                <span v-if="g.patrolCovered" class="text-primary-600">✓ 已计入巡逻覆盖</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-white rounded-xl shadow-sm border p-6">
          <h3 class="text-lg font-semibold mb-4">🔧 整改 & 复查（结果公示）</h3>
          <div class="space-y-4">
            <div v-if="issue.rectifications?.length">
              <div class="text-sm font-medium text-gray-700 mb-2">整改措施</div>
              <div class="space-y-3">
                <div v-for="r in issue.rectifications" :key="r.id" class="p-3 rounded-lg border-l-4" :class="r.completed ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-medium">{{ r.completed ? '✅ 已完成' : '⏳ 进行中' }}</span>
                    <span class="text-xs text-gray-500">负责人：{{ r.handler || '-' }}</span>
                  </div>
                  <p class="mt-1.5 text-sm text-gray-700">{{ r.action }}</p>
                  <div class="mt-1.5 text-xs text-gray-500 flex items-center gap-3">
                    <span>计划：{{ fmtDateTime(r.createdAt) }}</span>
                    <span>截止：{{ fmtDateTime(r.deadline) }}</span>
                    <span v-if="r.completedAt">完成：{{ fmtDateTime(r.completedAt) }}</span>
                  </div>
                  <p v-if="r.note" class="mt-2 text-xs text-gray-600 bg-white rounded p-2">📝 {{ r.note }}</p>
                  <PhotoGrid v-if="r.photos?.length" class="mt-2" :photos="r.photos" title="整改后照片" @preview="previewUrl = $event" />
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-400">暂无整改记录</div>

            <div v-if="issue.reviews?.length" class="border-t pt-4">
              <div class="text-sm font-medium text-gray-700 mb-2">复查记录</div>
              <div class="space-y-3">
                <div v-for="r in issue.reviews" :key="r.id" class="p-3 rounded-lg" :class="r.result === 'PASS' ? 'bg-emerald-50 border border-emerald-200' : r.result === 'FAIL' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-sm">{{ r.result === 'PASS' ? '✅ 通过' : r.result === 'FAIL' ? '❌ 未通过' : '🟡 需改进' }}</span>
                      <span v-if="r.rated" class="text-yellow-500">★ {{ r.rated }}/5</span>
                    </div>
                    <span class="text-xs text-gray-500">{{ fmtDateTime(r.reviewedAt) }}</span>
                  </div>
                  <div class="mt-1.5 text-xs text-gray-500">复查人：{{ r.reviewer }}</div>
                  <p v-if="r.comment" class="mt-2 text-sm text-gray-700">{{ r.comment }}</p>
                  <PhotoGrid v-if="r.photos?.length" class="mt-2" :photos="r.photos" title="复查现场照片" @preview="previewUrl = $event" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-xl shadow-sm border p-6">
          <Timeline :logs="issue.operationLogs" />
        </section>

        <section class="bg-white rounded-xl shadow-sm border p-6">
          <h3 class="text-lg font-semibold mb-3">📄 居民服务</h3>
          <a :href="`/api/issues/${issue.id}/export-xlsx`" target="_blank" class="block w-full text-center px-4 py-2 rounded bg-primary-600 text-white text-sm hover:bg-primary-700">下载单据（Excel）</a>
          <p class="mt-2 text-xs text-gray-500">下载后可留存，无需口头确认</p>
        </section>
      </div>
    </div>

    <div v-if="previewUrl" class="fixed inset-0 bg-black/80 z-50 grid place-items-center p-4 cursor-zoom-out" @click.self="previewUrl = null">
      <img :src="previewUrl" class="max-w-full max-h-[90vh] rounded-lg" />
    </div>
  </div>
  <div v-else class="text-center py-24 text-gray-500">加载中...</div>
</template>

<script setup lang="ts">
import type { Issue } from '~/types'
useHead({ title: '议题详情 - 居民议题闭环看板' })
const route = useRoute()
const id = computed(() => Number(route.params.id))
const issue = ref<Issue | null>(null)
const previewUrl = ref('')
const count = (o: string) => issue.value?.votes?.filter(v => v.option === o).length || 0
const pct = (o: string) => {
  const t = issue.value?.votes?.length || 0
  return t ? Math.round((count(o) / t) * 100) : 0
}
const optLabel = (o: string) => o === 'AGREE' ? '赞成' : o === 'DISAGREE' ? '反对' : '弃权'
const optColor = (o: string) => 'px-2 py-0.5 rounded text-xs ' + (o === 'AGREE' ? 'bg-green-100 text-green-700' : o === 'DISAGREE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')
onMounted(async () => {
  try {
    issue.value = await request<Issue>(`/public/issues/${route.params.code || id.value}`)
  } catch (e) {
    try { issue.value = await request<Issue>(`/issues/${id.value}`) } catch {}
  }
})
</script>
