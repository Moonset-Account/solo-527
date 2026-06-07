<script setup lang="ts">
import { Users, AlertTriangle, Clock, Repeat, Activity, Shield } from 'lucide-vue-next'
import { useQualityStore } from '@/stores/quality'
import KpiCard from '@/components/common/KpiCard.vue'
import CardContainer from '@/components/layout/CardContainer.vue'
import FunnelChart from '@/components/charts/FunnelChart.vue'
import TrendLineChart from '@/components/charts/TrendLineChart.vue'
import DataCaliberCard from '@/components/common/DataCaliberCard.vue'
import { formatNumber, formatPercent, formatDuration } from '@/utils/format'
import { useRouter } from 'vue-router'
import type { FunnelData } from '@/types'

const qualityStore = useQualityStore()
const router = useRouter()

function goToDetails(stage?: FunnelData) {
  const query: Record<string, string> = {}
  if (stage) {
    if (stage.stageCode === 'anomaly') {
      query.anomalyType = 'duration'
    }
  }
  router.push({ path: '/details', query })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <DataCaliberCard />

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KpiCard
        title="总样本量"
        :value="formatNumber(qualityStore.metrics.totalSamples)"
        unit="份"
        trend="up"
        trend-value="+12.5%"
        :icon="Users"
        color="primary"
      />
      <KpiCard
        title="有效样本量"
        :value="formatNumber(qualityStore.metrics.validSamples)"
        unit="份"
        trend="up"
        trend-value="+8.3%"
        :icon="Shield"
        color="success"
      />
      <KpiCard
        title="异常率"
        :value="formatPercent(qualityStore.metrics.anomalyRate)"
        trend="down"
        trend-value="-2.1%"
        :icon="AlertTriangle"
        color="danger"
      />
      <KpiCard
        title="平均答题时长"
        :value="formatDuration(qualityStore.metrics.avgDuration)"
        trend="flat"
        trend-value="持平"
        :icon="Clock"
        color="warning"
      />
      <KpiCard
        title="跳题率"
        :value="formatPercent(qualityStore.metrics.skipRate)"
        trend="down"
        trend-value="-1.2%"
        :icon="Activity"
        color="secondary"
      />
      <KpiCard
        title="重复提交率"
        :value="formatPercent(qualityStore.metrics.duplicateRate)"
        trend="up"
        trend-value="+0.5%"
        :icon="Repeat"
        color="secondary"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CardContainer title="样本转化漏斗">
        <template #header-actions>
          <span class="text-xs text-survey-text-muted">点击漏斗阶段可下钻明细</span>
        </template>
        <FunnelChart
          :data="qualityStore.funnelData"
          :height="320"
          @stage-click="goToDetails"
        />
      </CardContainer>

      <CardContainer title="异常趋势">
        <template #header-actions>
          <span class="text-xs px-2 py-0.5 rounded bg-survey-primary/20 text-survey-primary">
            线上问卷样本质量监控 · 原始记录
          </span>
        </template>
        <TrendLineChart :data="qualityStore.trendData" />
      </CardContainer>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CardContainer title="渠道质量概览" class="lg:col-span-2">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-survey-border">
                <th class="text-left py-2.5 px-3 font-medium text-survey-text-secondary">渠道</th>
                <th class="text-right py-2.5 px-3 font-medium text-survey-text-secondary">样本量</th>
                <th class="text-right py-2.5 px-3 font-medium text-survey-text-secondary">质量分</th>
                <th class="text-right py-2.5 px-3 font-medium text-survey-text-secondary">异常率</th>
                <th class="text-right py-2.5 px-3 font-medium text-survey-text-secondary">平均时长</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="channel in qualityStore.channelRanking.slice(0, 5)"
                :key="channel.channelId"
                class="border-b border-survey-border/50 hover:bg-survey-surface-hover/50 cursor-pointer"
                @click="router.push({ path: '/details', query: { channel: channel.channelId } })"
              >
                <td class="py-2.5 px-3 text-survey-text-primary">{{ channel.channelName }}</td>
                <td class="py-2.5 px-3 text-right font-mono text-survey-text-primary">{{ formatNumber(channel.totalSamples) }}</td>
                <td class="py-2.5 px-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-20 h-2 bg-survey-bg rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full"
                        :style="{
                          width: `${channel.qualityScore}%`,
                          backgroundColor: channel.qualityScore >= 90 ? '#10B981' : channel.qualityScore >= 80 ? '#F59E0B' : '#EF4444'
                        }"
                      ></div>
                    </div>
                    <span class="font-mono text-survey-text-primary">{{ channel.qualityScore }}</span>
                  </div>
                </td>
                <td class="py-2.5 px-3 text-right font-mono" :class="channel.anomalyRate > 0.1 ? 'text-survey-danger' : 'text-survey-text-primary'">
                  {{ formatPercent(channel.anomalyRate) }}
                </td>
                <td class="py-2.5 px-3 text-right font-mono text-survey-text-secondary">{{ formatDuration(channel.avgDuration) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContainer>

      <CardContainer title="核心指标">
        <div class="space-y-4">
          <div v-for="metric in [
            { name: 'IP 异常率', value: qualityStore.metrics.ipAbnormalRate, desc: 'IP 归属地或集中度异常' },
            { name: '设备异常率', value: qualityStore.metrics.deviceAbnormalRate, desc: '设备指纹检测异常' },
            { name: '质检标记率', value: qualityStore.metrics.qualityMarkRate, desc: '人工质检标记样本' },
          ]" :key="metric.name">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-survey-text-secondary">{{ metric.name }}</span>
              <span class="text-sm font-mono text-survey-text-primary">{{ formatPercent(metric.value) }}</span>
            </div>
            <div class="w-full h-1.5 bg-survey-bg rounded-full overflow-hidden">
              <div
                class="h-full bg-survey-primary rounded-full transition-all"
                :style="{ width: `${Math.min(metric.value * 500, 100)}%` }"
              ></div>
            </div>
            <p class="text-xs text-survey-text-muted mt-1">{{ metric.desc }}</p>
          </div>
        </div>
      </CardContainer>
    </div>
  </div>
</template>
