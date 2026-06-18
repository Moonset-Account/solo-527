<script setup lang="ts">
import { onMounted } from 'vue'
import { useLeadsStore } from '@/stores/leads'
import { usePredictionsStore } from '@/stores/predictions'
import {
  ClipboardList, TrendingUp, Users, Clock,
  AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const leadsStore = useLeadsStore()
const predictionsStore = usePredictionsStore()

onMounted(async () => {
  await Promise.all([
    leadsStore.fetchStats(),
    predictionsStore.fetchFunnel(),
  ])
})

const statCards = [
  { label: '总线索数', key: 'total', icon: ClipboardList, color: 'bg-blue-500' },
  { label: '本周新增', key: 'newThisWeek', icon: Users, color: 'bg-amber-500' },
  { label: '转化率', key: 'conversionRate', icon: TrendingUp, color: 'bg-emerald-500', suffix: '%' },
  { label: '平均响应', key: 'avgResponseTime', icon: Clock, color: 'bg-purple-500', suffix: '小时' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">工作台</h1>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">{{ card.label }}</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">
              {{ (leadsStore.stats as Record<string, number>)[card.key] ?? 0 }}
              <span class="text-sm font-normal text-slate-400">{{ card.suffix || '' }}</span>
            </p>
          </div>
          <div :class="card.color" class="w-10 h-10 rounded-lg flex items-center justify-center">
            <component :is="card.icon" class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-slate-800">转化漏斗</h3>
          <button
            class="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            @click="router.push('/predictions')"
          >
            查看详情 <ArrowUpRight class="w-3 h-3" />
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="item in predictionsStore.funnelData"
            :key="item.stage"
            class="flex items-center gap-3"
          >
            <span class="text-sm text-slate-600 w-16 text-right">{{ item.stage }}</span>
            <div class="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-amber-500 rounded-full transition-all duration-500"
                :style="{ width: `${item.rate}%` }"
              />
            </div>
            <span class="text-sm font-medium text-slate-700 w-12">{{ item.count }}</span>
            <span class="text-xs text-slate-400 w-12">{{ item.rate }}%</span>
          </div>
          <div v-if="!predictionsStore.funnelData.length" class="text-center text-slate-400 text-sm py-4">
            暂无数据
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-slate-800">待办提醒</h3>
          <span class="text-xs text-slate-400">今日</span>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-3 p-3 bg-amber-50 rounded-md border border-amber-100">
            <AlertCircle class="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm text-slate-800">3条线索超过24小时未联系</p>
              <p class="text-xs text-slate-400 mt-0.5">需要立即安排回访</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-red-50 rounded-md border border-red-100">
            <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm text-slate-800">2个高流失风险客户</p>
              <p class="text-xs text-slate-400 mt-0.5">建议尽快进行重点回访</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-emerald-50 rounded-md border border-emerald-100">
            <CheckCircle2 class="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm text-slate-800">5条线索即将签约</p>
              <p class="text-xs text-slate-400 mt-0.5">请及时跟进合同签署</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <h3 class="font-medium text-slate-800 mb-4">快捷入口</h3>
      <div class="grid grid-cols-4 gap-4">
        <button
          class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          @click="router.push('/leads')"
        >
          <ClipboardList class="w-6 h-6 text-amber-500" />
          <span class="text-sm text-slate-700">线索管理</span>
        </button>
        <button
          class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          @click="router.push('/followup-plans')"
        >
          <Clock class="w-6 h-6 text-amber-500" />
          <span class="text-sm text-slate-700">回访计划</span>
        </button>
        <button
          class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          @click="router.push('/predictions')"
        >
          <TrendingUp class="w-6 h-6 text-amber-500" />
          <span class="text-sm text-slate-700">转化预测</span>
        </button>
        <button
          class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          @click="router.push('/churn')"
        >
          <ArrowDownRight class="w-6 h-6 text-amber-500" />
          <span class="text-sm text-slate-700">流失分析</span>
        </button>
      </div>
    </div>
  </div>
</template>
