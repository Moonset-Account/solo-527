<script setup lang="ts">
import {
  Trophy, Award, Target, AlertTriangle, BarChart3, TrendingUp,
  PieChart, Users, FileText, Star, ChevronRight
} from 'lucide-vue-next'

const qualityData = [
  {
    grade: 'A', label: '优质线索', count: 156, percent: 24,
    desc: '高意向+明确需求+有消费能力', color: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
    icon: Trophy, avgAmount: 38600, conversion: 68,
  },
  {
    grade: 'B', label: '良好线索', count: 248, percent: 38,
    desc: '有需求+消费意向中等', color: 'from-sky-400 to-blue-600',
    bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200',
    icon: Award, avgAmount: 22400, conversion: 42,
  },
  {
    grade: 'C', label: '一般线索', count: 168, percent: 26,
    desc: '需求模糊+需持续培育', color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
    icon: Target, avgAmount: 12800, conversion: 21,
  },
  {
    grade: 'D', label: '待培养', count: 78, percent: 12,
    desc: '低意向+需求不明确', color: 'from-gray-400 to-slate-600',
    bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200',
    icon: AlertTriangle, avgAmount: 5600, conversion: 8,
  },
]

const advisorMatrix = [
  {
    name: '林医生', total: 132,
    grades: { A: 42, B: 58, C: 24, D: 8 },
    conversion: 52, revenue: 2680000,
  },
  {
    name: '王医生', total: 98,
    grades: { A: 28, B: 42, C: 19, D: 9 },
    conversion: 48, revenue: 1920000,
  },
  {
    name: '张顾问', total: 186,
    grades: { A: 52, B: 76, C: 38, D: 20 },
    conversion: 44, revenue: 3560000,
  },
  {
    name: '刘顾问', total: 146,
    grades: { A: 34, B: 52, C: 42, D: 18 },
    conversion: 38, revenue: 2280000,
  },
  {
    name: '陈护士', total: 88,
    grades: { A: 0, B: 20, C: 45, D: 23 },
    conversion: 18, revenue: 580000,
  },
]

const totalLeads = computed(() => qualityData.reduce((s, q) => s + q.count, 0))
const totalRevenue = computed(() => advisorMatrix.reduce((s, a) => s + a.revenue, 0))
const weightedConversion = computed(() => {
  const total = qualityData.reduce((s, q) => s + q.count, 0)
  return qualityData.reduce((s, q) => s + (q.count * q.conversion) / 100, 0) / total * 100
})

function getBarWidth(count: number, max: number) {
  return `${Math.max(3, (count / max) * 100)}%`
}
const maxGradeCount = Math.max(...qualityData.map(q => q.count))
const maxGradePercent = qualityData.find(q => q.count === maxGradeCount)?.percent || 100
</script>

<template>
  <div class="p-6 space-y-6 bg-gray-50 min-h-screen">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">线索质量统计</h1>
      <p class="text-gray-500 text-sm mt-1">A/B/C/D 质量分布 · 按顾问的质量矩阵分析</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard class="border-0 shadow-card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <template #body>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <PieChart class="w-6 h-6" />
            </div>
            <div>
              <p class="text-primary-50 text-sm">总线索数</p>
              <p class="text-3xl font-bold">{{ totalLeads }}</p>
            </div>
          </div>
        </template>
      </UCard>
      <UCard class="border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Trophy class="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p class="text-gray-500 text-sm">A 级优质占比</p>
              <p class="text-3xl font-bold text-emerald-600">{{ qualityData[0].percent }}%</p>
            </div>
          </div>
        </template>
      </UCard>
      <UCard class="border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <TrendingUp class="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <p class="text-gray-500 text-sm">加权成交率</p>
              <p class="text-3xl font-bold text-violet-600">{{ weightedConversion.toFixed(1) }}%</p>
            </div>
          </div>
        </template>
      </UCard>
      <UCard class="border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText class="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p class="text-gray-500 text-sm">质量线索总值</p>
              <p class="text-3xl font-bold text-amber-600">¥{{ (totalRevenue / 10000).toFixed(0) }}万</p>
            </div>
          </div>
        </template>
      </UCard>
    </div>

    <UCard class="border-0 shadow-card">
      <template #body>
        <div class="flex items-center gap-2 mb-6">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <BarChart3 class="w-5 h-5 text-emerald-500" />
          </div>
          <h2 class="text-lg font-semibold text-gray-800">线索等级分布</h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div class="lg:col-span-2">
            <div class="relative h-72 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6 flex items-center justify-center">
              <div class="relative">
                <svg viewBox="0 0 200 200" class="w-56 h-56 -rotate-90">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#F3F4F6" stroke-width="28" />
                  <circle
                    v-for="(q, i) in qualityData"
                    :key="q.grade"
                    cx="100" cy="100" r="80" fill="none"
                    stroke="currentColor"
                    stroke-width="28"
                    :stroke-dasharray="`${(q.percent / 100) * 502.65} 502.65`"
                    :stroke-dashoffset="`${-(qualityData.slice(0, i).reduce((s, p) => s + p.percent, 0) / 100) * 502.65}`"
                    :class="q.text"
                    class="transition-all duration-700"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <p class="text-4xl font-bold text-gray-800">{{ totalLeads }}</p>
                  <p class="text-xs text-gray-400">总线索数</p>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-3 space-y-3">
            <div
              v-for="(q, idx) in qualityData"
              :key="q.grade"
              class="p-4 rounded-2xl border transition-all hover:shadow-cardHover animate-fade-in cursor-pointer"
              :class="[q.bg, q.border]"
              :style="{ animationDelay: `${idx * 60}ms` }"
            >
              <div class="flex items-center gap-4">
                <div :class="['w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md', q.color]">
                  <component :is="q.icon" class="w-7 h-7 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span :class="['w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg', q.bg, q.text, q.border, 'border']">
                      {{ q.grade }}
                    </span>
                    <span class="font-bold text-gray-800">{{ q.label }}</span>
                    <UBadge size="sm" variant="solid" class="ml-auto" :class="`!bg-gradient-to-r ${q.color}`">
                      {{ q.percent }}%
                    </UBadge>
                  </div>
                  <p class="text-xs text-gray-500 mb-2">{{ q.desc }}</p>
                  <div class="h-2.5 rounded-full bg-white/60 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r transition-all duration-700"
                      :class="q.color"
                      :style="{ width: `${(q.percent / maxGradePercent) * 100}%` }"
                    ></div>
                  </div>
                </div>
                <div class="text-right pl-4 border-l border-gray-200/60 min-w-[100px]">
                  <p class="text-2xl font-bold text-gray-800">{{ q.count }}</p>
                  <p class="text-xs text-gray-500">条线索</p>
                  <div class="mt-2 pt-2 border-t border-gray-200/60 space-y-0.5">
                    <p class="text-xs text-gray-500">均 ¥{{ (q.avgAmount / 1000).toFixed(1) }}k</p>
                    <p class="text-xs font-semibold" :class="q.text">成交率 {{ q.conversion }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UCard>

    <UCard class="border-0 shadow-card">
      <template #body>
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users class="w-5 h-5 text-violet-500" />
            </div>
            <h2 class="text-lg font-semibold text-gray-800">顾问质量矩阵</h2>
          </div>
          <UBadge size="sm" variant="subtle" color="violet">按客户质量分级统计</UBadge>
        </div>

        <div class="overflow-x-auto -mx-2">
          <table class="w-full min-w-[780px]">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500">顾问</th>
                <th class="text-center px-3 py-3 text-xs font-semibold text-gray-500 w-[380px]">质量分布 (A / B / C / D)</th>
                <th class="text-center px-3 py-3 text-xs font-semibold text-gray-500">总数</th>
                <th class="text-center px-3 py-3 text-xs font-semibold text-gray-500">成交率</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500">贡献营收</th>
                <th class="w-12"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(a, idx) in advisorMatrix"
                :key="a.name"
                class="border-b border-gray-50 hover:bg-primary-50/30 transition-colors animate-fade-in"
                :style="{ animationDelay: `${idx * 50}ms` }"
              >
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white font-bold flex items-center justify-center shadow-sm">
                      {{ a.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-800">{{ a.name }}</p>
                      <p class="text-xs text-gray-400">A 级率 {{ ((a.grades.A / a.total) * 100).toFixed(0) }}%</p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-4">
                  <div class="grid grid-cols-4 gap-1.5">
                    <div class="flex items-center gap-1.5">
                      <div class="flex-1 h-6 rounded-md bg-emerald-100 relative overflow-hidden flex items-center justify-center text-xs font-bold text-emerald-700"
                        :style="{ width: getBarWidth(a.grades.A, Math.max(...advisorMatrix.map(x => x.grades.A))) }"
                      >
                        {{ a.grades.A }}
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <div class="flex-1 h-6 rounded-md bg-sky-100 relative overflow-hidden flex items-center justify-center text-xs font-bold text-sky-700"
                        :style="{ width: getBarWidth(a.grades.B, Math.max(...advisorMatrix.map(x => x.grades.B))) }"
                      >
                        {{ a.grades.B }}
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <div class="flex-1 h-6 rounded-md bg-amber-100 relative overflow-hidden flex items-center justify-center text-xs font-bold text-amber-700"
                        :style="{ width: getBarWidth(a.grades.C, Math.max(...advisorMatrix.map(x => x.grades.C))) }"
                      >
                        {{ a.grades.C }}
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <div class="flex-1 h-6 rounded-md bg-gray-200 relative overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600"
                        :style="{ width: getBarWidth(a.grades.D, Math.max(...advisorMatrix.map(x => x.grades.D))) }"
                      >
                        {{ a.grades.D }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-4 text-center">
                  <span class="inline-flex items-center justify-center min-w-[44px] h-8 px-3 rounded-lg bg-gray-50 font-bold text-gray-700 text-sm">
                    {{ a.total }}
                  </span>
                </td>
                <td class="px-3 py-4 text-center">
                  <UBadge
                    size="sm"
                    :color="a.conversion >= 50 ? 'emerald' : a.conversion >= 40 ? 'primary' : a.conversion >= 30 ? 'amber' : 'rose'"
                    variant="solid"
                  >
                    {{ a.conversion }}%
                  </UBadge>
                </td>
                <td class="px-4 py-4 text-right">
                  <p class="text-lg font-bold text-primary-600">¥{{ (a.revenue / 10000).toFixed(0) }}<span class="text-sm font-normal text-gray-400">万</span></p>
                </td>
                <td class="px-2 py-4">
                  <ChevronRight class="w-4 h-4 text-gray-300" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 pt-5 border-t border-gray-100 grid grid-cols-4 gap-4">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-emerald-100"></div>
            <span class="text-xs text-gray-500">A 级优质</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-sky-100"></div>
            <span class="text-xs text-gray-500">B 级良好</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-amber-100"></div>
            <span class="text-xs text-gray-500">C 级一般</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-gray-200"></div>
            <span class="text-xs text-gray-500">D 级待培养</span>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
