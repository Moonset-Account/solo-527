<template>
  <div>
    <StatsGrid :stats="stats" />
    <div class="grid grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">候选人阶段分布</h3>
        <div class="space-y-3">
          <div v-for="item in byStage" :key="item.stage" class="flex items-center gap-4">
            <span class="text-sm text-gray-600 w-24">{{ stageLabels[item.stage] || item.stage }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all"
                :style="{ width: totalCandidates ? (item.count / totalCandidates * 100) + '%' : '0%' }"
              ></div>
            </div>
            <span class="text-sm font-medium w-12 text-right">{{ item.count }}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">部门候选人分布</h3>
        <div class="space-y-3">
          <div v-for="item in byDepartment" :key="item.department" class="flex items-center gap-4">
            <span class="text-sm text-gray-600 w-24">{{ item.department || '未分配' }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                class="h-full bg-emerald-500 rounded-full transition-all"
                :style="{ width: totalCandidates ? (item.count / totalCandidates * 100) + '%' : '0%' }"
              ></div>
            </div>
            <span class="text-sm font-medium w-12 text-right">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-6 grid grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">面试官面试质量评分</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="pb-2">面试官</th>
              <th class="pb-2">部门</th>
              <th class="pb-2 text-center">面试数</th>
              <th class="pb-2 text-right">平均分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in interviewerQuality" :key="item.interviewerId" class="border-b border-gray-50">
              <td class="py-3 font-medium">{{ item.interviewerName }}</td>
              <td class="py-3 text-gray-600">{{ item.department }}</td>
              <td class="py-3 text-center">{{ item.interviewCount }}</td>
              <td class="py-3 text-right font-semibold text-primary-600">{{ item.avgQuality.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">最近提醒</h3>
        <div class="space-y-3">
          <div
            v-for="r in recentReminders"
            :key="r.id"
            class="flex items-start gap-3 p-3 rounded-lg border"
            :class="reminderSeverityColors[r.severity]"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm">{{ r.title }}</span>
                <BadgeTag :text="reminderSeverityLabels[r.severity]" />
              </div>
              <p class="text-xs text-gray-600 mt-1">{{ r.message }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(r.sendAt) }}</p>
            </div>
          </div>
          <p v-if="recentReminders.length === 0" class="text-sm text-gray-400 text-center py-4">暂无提醒</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { stageLabels, reminderSeverityColors, reminderSeverityLabels, formatDate } from '~/composables/useConstants'

const reportData = ref<any>({ overview: {}, byStage: [], byDepartment: [], interviewerQuality: [] })
const reminders = ref<any[]>([])

const stats = computed(() => [
  { label: '候选人总数', value: reportData.value.overview.totalCandidates || 0, icon: '👥', bg: 'bg-blue-50' },
  { label: '本月面试', value: reportData.value.overview.interviewsThisMonth || 0, icon: '📅', bg: 'bg-green-50' },
  { label: '平均质量评分', value: reportData.value.overview.avgQualityScore || '-', icon: '⭐', bg: 'bg-yellow-50' },
  { label: '爽约次数', value: reportData.value.overview.noShowCount || 0, icon: '⚠️', bg: 'bg-red-50', sub: `${reportData.value.overview.completedQualityInterviews || 0} 次已评面试` }
])
const byStage = computed(() => reportData.value.byStage || [])
const byDepartment = computed(() => reportData.value.byDepartment || [])
const interviewerQuality = computed(() => reportData.value.interviewerQuality || [])
const totalCandidates = computed(() => reportData.value.overview.totalCandidates || 0)
const recentReminders = computed(() => reminders.value.slice(0, 5))

onMounted(async () => {
  try {
    reportData.value = await $fetch('/api/reports/summary')
  } catch (e) {
    console.warn('Report data unavailable:', e)
  }
  try {
    reminders.value = await $fetch('/api/reminders')
  } catch (e) {
    console.warn('Reminders unavailable:', e)
  }
})
</script>
