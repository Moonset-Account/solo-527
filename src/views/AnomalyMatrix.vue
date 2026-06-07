<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQualityStore } from '@/stores/quality'
import CardContainer from '@/components/layout/CardContainer.vue'
import AnomalyMatrixChart from '@/components/charts/AnomalyMatrixChart.vue'
import DurationBoxplot from '@/components/charts/DurationBoxplot.vue'
import NoteModal from '@/components/common/NoteModal.vue'
import { formatNumber, formatPercent, formatDuration } from '@/utils/format'
import { TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-vue-next'
import type { AnomalyMatrixCell, ChannelRanking, QuestionGroupDuration } from '@/types'

const qualityStore = useQualityStore()
const router = useRouter()

const showNoteModal = ref(false)
const noteTarget = ref<{ type: 'channel' | 'anomaly', id: string, name: string } | null>(null)

function handleCellClick(cell: AnomalyMatrixCell) {
  router.push({
    path: '/details',
    query: { channel: cell.channelId, anomalyType: cell.anomalyType }
  })
}

function handleGroupClick(group: QuestionGroupDuration) {
  console.log('Group clicked:', group)
}

function openChannelNote(channel: ChannelRanking) {
  noteTarget.value = {
    type: 'channel',
    id: channel.channelId,
    name: channel.channelName,
  }
  showNoteModal.value = true
}

function getTrendIcon(trend: string) {
  if (trend === 'up') return TrendingUp
  if (trend === 'down') return TrendingDown
  return Minus
}

function getTrendClass(trend: string) {
  if (trend === 'up') return 'text-survey-danger'
  if (trend === 'down') return 'text-survey-success'
  return 'text-survey-text-muted'
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <CardContainer title="异常提交矩阵（渠道 × 异常类型）">
      <template #header-actions>
        <span class="text-xs text-survey-text-muted">点击单元格下钻查看明细样本</span>
      </template>
      <AnomalyMatrixChart
        :data="qualityStore.anomalyMatrix"
        @cell-click="handleCellClick"
      />
    </CardContainer>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CardContainer title="渠道质量排行榜">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-survey-border">
                <th class="text-left py-2.5 px-3 font-medium text-survey-text-secondary w-12">排名</th>
                <th class="text-left py-2.5 px-3 font-medium text-survey-text-secondary">渠道</th>
                <th class="text-right py-2.5 px-3 font-medium text-survey-text-secondary">样本量</th>
                <th class="text-right py-2.5 px-3 font-medium text-survey-text-secondary">质量分</th>
                <th class="text-right py-2.5 px-3 font-medium text-survey-text-secondary">异常率</th>
                <th class="text-center py-2.5 px-3 font-medium text-survey-text-secondary">趋势</th>
                <th class="text-center py-2.5 px-3 font-medium text-survey-text-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="channel in qualityStore.channelRanking"
                :key="channel.channelId"
                class="border-b border-survey-border/50 hover:bg-survey-surface-hover/50"
              >
                <td class="py-3 px-3">
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                    :class="channel.rank <= 3 ? 'bg-survey-primary/20 text-survey-primary' : 'bg-survey-surface-hover text-survey-text-muted'"
                  >
                    {{ channel.rank }}
                  </span>
                </td>
                <td class="py-3 px-3 text-survey-text-primary font-medium">{{ channel.channelName }}</td>
                <td class="py-3 px-3 text-right font-mono text-survey-text-primary">{{ formatNumber(channel.totalSamples) }}</td>
                <td class="py-3 px-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-16 h-2 bg-survey-bg rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full"
                        :style="{
                          width: `${channel.qualityScore}%`,
                          backgroundColor: channel.qualityScore >= 90 ? '#10B981' : channel.qualityScore >= 80 ? '#F59E0B' : '#EF4444'
                        }"
                      ></div>
                    </div>
                    <span class="font-mono text-survey-text-primary w-8">{{ channel.qualityScore }}</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-right font-mono" :class="channel.anomalyRate > 0.1 ? 'text-survey-danger' : 'text-survey-text-primary'">
                  {{ formatPercent(channel.anomalyRate) }}
                </td>
                <td class="py-3 px-3 text-center">
                  <component :is="getTrendIcon(channel.trend)" class="w-4 h-4 inline" :class="getTrendClass(channel.trend)" />
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    @click="openChannelNote(channel)"
                    class="p-1.5 rounded hover:bg-survey-bg text-survey-text-muted hover:text-survey-secondary transition-colors"
                    title="添加备注"
                  >
                    <MessageSquare class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContainer>

      <CardContainer title="题组耗时分布">
        <template #header-actions>
          <span class="text-xs text-survey-text-muted">箱线图展示四分位分布，红点为离群值</span>
        </template>
        <DurationBoxplot
          :data="qualityStore.questionGroupDurations"
          @group-click="handleGroupClick"
        />
      </CardContainer>
    </div>

    <NoteModal
      v-if="noteTarget"
      :visible="showNoteModal"
      :target-type="noteTarget.type"
      :target-id="noteTarget.id"
      :target-name="noteTarget.name"
      @close="showNoteModal = false"
      @saved="showNoteModal = false"
    />
  </div>
</template>
