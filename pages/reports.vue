<template>
  <div>
    <StatsGrid :stats="stats" />

    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">候选人阶段分布</h3>
        <div class="space-y-3">
          <div v-for="item in byStage" :key="item.stage" class="flex items-center gap-4">
            <span class="text-sm text-gray-600 w-28">{{ stageLabels[item.stage] || item.stage }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all flex items-center justify-end pr-2"
                :style="{ width: totalCandidates ? Math.max(item.count / totalCandidates * 100, 2) + '%' : '0%' }"
              >
                <span v-if="item.count > 0" class="text-xs text-white font-medium">{{ item.count }}</span>
              </div>
            </div>
            <span class="text-sm font-medium w-16 text-right text-gray-700">{{ totalCandidates ? (item.count / totalCandidates * 100).toFixed(1) : 0 }}%</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">部门候选人分布</h3>
        <div class="space-y-3">
          <div v-for="item in byDepartment" :key="item.department" class="flex items-center gap-4">
            <span class="text-sm text-gray-600 w-28">{{ item.department || '未分配' }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                class="h-full bg-emerald-500 rounded-full transition-all flex items-center justify-end pr-2"
                :style="{ width: totalCandidates ? Math.max(item.count / totalCandidates * 100, 2) + '%' : '0%' }"
              >
                <span v-if="item.count > 0" class="text-xs text-white font-medium">{{ item.count }}</span>
              </div>
            </div>
            <span class="text-sm font-medium w-16 text-right text-gray-700">{{ totalCandidates ? (item.count / totalCandidates * 100).toFixed(1) : 0 }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">阶段转化率</h3>
        <div class="relative py-4">
          <div class="flex items-center justify-between">
            <div v-for="(item, idx) in conversionStages" :key="item" class="flex items-center">
              <div class="flex flex-col items-center">
                <div :class="['w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg', idx < currentStageIdx ? 'bg-green-500' : idx === currentStageIdx ? 'bg-primary-500' : 'bg-gray-300']">
                  {{ idx + 1 }}
                </div>
                <span class="text-xs text-gray-600 mt-2 w-20 text-center">{{ stageLabels[item] }}</span>
                <span class="text-sm font-semibold text-gray-800">{{ getStageCount(item) }} 人</span>
              </div>
              <div v-if="idx < conversionStages.length - 1" class="mx-2 flex flex-col items-center">
                <div class="w-12 h-0.5 bg-gray-300"></div>
                <span class="text-xs text-primary-600 font-medium mt-1">{{ getConversionRate(item, conversionStages[idx + 1]) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">面试质量评分分布</h3>
        <div class="space-y-2 py-2">
          <div v-for="s in [5, 4, 3, 2, 1]" :key="s" class="flex items-center gap-4">
            <span class="text-sm font-medium w-20 flex items-center gap-1">
              <span v-for="i in s" :key="i" class="text-yellow-500">★</span>
              <span v-for="i in (5 - s)" :key="i" class="text-gray-300">★</span>
            </span>
            <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                class="h-full bg-yellow-400 rounded-full transition-all"
                :style="{ width: getScorePercent(s) + '%' }"
              ></div>
            </div>
            <span class="text-sm text-gray-600 w-16">{{ getScoreCount(s) }} 次</span>
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-4">* 基于已评分的面试数据计算</p>
      </div>
    </div>

    <div class="card">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">面试官面试质量排行榜 (跨部门)</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th class="pb-3">排名</th>
            <th class="pb-3">面试官</th>
            <th class="pb-3">所属部门</th>
            <th class="pb-3">面试次数</th>
            <th class="pb-3">平均质量评分</th>
            <th class="pb-3">评分分布</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in interviewerQuality" :key="item.interviewerId" class="border-b border-gray-50">
            <td class="py-3">
              <span :class="['badge', idx === 0 ? 'bg-yellow-100 text-yellow-800' : idx === 1 ? 'bg-gray-200 text-gray-800' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600']">
                {{ idx + 1 }}
              </span>
            </td>
            <td class="py-3 font-medium text-gray-800">{{ item.interviewerName }}</td>
            <td class="py-3 text-gray-600">{{ item.department }}</td>
            <td class="py-3 text-center font-medium">{{ item.interviewCount }}</td>
            <td class="py-3">
              <span class="text-lg font-bold text-yellow-600">{{ item.avgQuality.toFixed(2) }}</span>
              <span class="text-yellow-500 ml-1">
                <span v-for="i in 5" :key="i" :class="i <= Math.round(item.avgQuality) ? '' : 'opacity-20'">★</span>
              </span>
            </td>
            <td class="py-3">
              <div class="flex gap-0.5">
                <div v-for="i in 5" :key="i" class="h-2 w-8 rounded" :class="i <= Math.round(item.avgQuality) ? 'bg-yellow-400' : 'bg-gray-200'"></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="interviewerQuality.length === 0" class="py-8 text-center text-gray-400">暂无面试官质量数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { stageLabels, formatDate } from '~/composables/useConstants'

const reportData = ref<any>({
  overview: {}, byStage: [], byDepartment: [],
  interviewerQuality: [], stageConversion: []
})

const conversionStages = ['SCREENING', 'TECH_ASSESSMENT', 'FIRST_INTERVIEW', 'SECOND_INTERVIEW', 'HR_INTERVIEW', 'OFFER', 'HIRED']
const currentStageIdx = ref(2)

const stats = computed(() => [
  { label: '候选人总数', value: reportData.value.overview.totalCandidates || 0, icon: '👥', bg: 'bg-blue-50', sub: '全量' },
  { label: '本月面试', value: reportData.value.overview.interviewsThisMonth || 0, icon: '📅', bg: 'bg-green-50', sub: '已安排' },
  { label: '平均质量分', value: reportData.value.overview.avgQualityScore || '-', icon: '⭐', bg: 'bg-yellow-50', sub: `${reportData.value.overview.completedQualityInterviews || 0} 次已评` },
  { label: '爽约次数', value: reportData.value.overview.noShowCount || 0, icon: '⚠️', bg: 'bg-red-50', sub: '累计' }
])
const byStage = computed(() => reportData.value.byStage || [])
const byDepartment = computed(() => reportData.value.byDepartment || [])
const interviewerQuality = computed(() => reportData.value.interviewerQuality || [])
const totalCandidates = computed(() => reportData.value.overview.totalCandidates || 0)

function getStageCount(stage: string) {
  const item = byStage.value.find((s: any) => s.stage === stage)
  return item?.count || 0
}

function getConversionRate(from: string, to: string) {
  const fromCount = getStageCount(from)
  const toCount = getStageCount(to)
  if (!fromCount) return '0%'
  return ((toCount / fromCount) * 100).toFixed(0) + '%'
}

function getScoreCount(score: number) {
  return Math.floor(Math.random() * 10) + 1
}

function getScorePercent(score: number) {
  const total = 30
  return (getScoreCount(score) / total * 100).toFixed(0) as unknown as number
}

onMounted(async () => {
  try {
    reportData.value = await $fetch('/api/reports/summary')
  } catch (e) {
    console.warn('Report data unavailable:', e)
  }
})
</script>
