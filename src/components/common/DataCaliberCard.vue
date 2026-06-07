<script setup lang="ts">
import { computed } from 'vue'
import { Database, Clock, Filter, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useQualityStore } from '@/stores/quality'
import { formatNumber, formatPercent, formatDateTime } from '@/utils/format'
import { ref } from 'vue'

const qualityStore = useQualityStore()
const showDetails = ref(false)

const caliberInfo = computed(() => {
  const caliber = qualityStore.dataCaliberInfo
  return {
    ...caliber,
    filterDesc: qualityStore.filterDescription,
  }
})

function toggleDetails() {
  showDetails.value = !showDetails.value
}
</script>

<template>
  <div class="bg-survey-surface border border-survey-border rounded-lg overflow-hidden">
    <div class="p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Database class="w-4 h-4 text-survey-primary" />
          <span class="text-sm font-medium text-survey-text-primary">数据校验口径</span>
          <span class="text-xs px-2 py-0.5 rounded bg-survey-primary/20 text-survey-primary font-mono">
            {{ caliberInfo.queryId }}
          </span>
        </div>
        <button
          @click="toggleDetails"
          class="flex items-center gap-1 text-xs text-survey-text-muted hover:text-survey-primary transition-colors"
        >
          {{ showDetails ? '收起详情' : '展开校验详情' }}
          <component :is="showDetails ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
        <div class="bg-survey-bg rounded-lg p-2.5">
          <p class="text-xs text-survey-text-muted mb-0.5">原始记录数</p>
          <p class="text-base font-mono font-bold text-survey-text-primary">{{ formatNumber(caliberInfo.totalRawRecords) }}</p>
        </div>
        <div class="bg-survey-bg rounded-lg p-2.5">
          <p class="text-xs text-survey-text-muted mb-0.5">校验通过</p>
          <p class="text-base font-mono font-bold text-survey-success">{{ formatNumber(caliberInfo.validRecords) }}</p>
        </div>
        <div class="bg-survey-bg rounded-lg p-2.5">
          <p class="text-xs text-survey-text-muted mb-0.5">校验未通过</p>
          <p class="text-base font-mono font-bold text-survey-danger">{{ formatNumber(caliberInfo.invalidRecords) }}</p>
        </div>
        <div class="bg-survey-bg rounded-lg p-2.5">
          <p class="text-xs text-survey-text-muted mb-0.5">整体通过率</p>
          <p class="text-base font-mono font-bold text-survey-secondary">{{ formatPercent(caliberInfo.checkPassRate) }}</p>
        </div>
        <div class="bg-survey-bg rounded-lg p-2.5">
          <p class="text-xs text-survey-text-muted mb-0.5">时间窗口</p>
          <p class="text-sm font-medium text-survey-text-primary">{{ caliberInfo.timeWindow }}</p>
        </div>
        <div class="bg-survey-bg rounded-lg p-2.5">
          <p class="text-xs text-survey-text-muted mb-0.5">筛选条件</p>
          <p class="text-sm font-medium text-survey-text-primary truncate" :title="caliberInfo.filterDesc">{{ caliberInfo.filterDesc }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 text-xs">
        <div class="flex items-center gap-1.5">
          <Clock class="w-3.5 h-3.5 text-survey-text-muted" />
          <span class="text-survey-text-muted">最后更新:</span>
          <span class="text-survey-text-primary font-mono">{{ caliberInfo.lastUpdateTime }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Database class="w-3.5 h-3.5 text-survey-text-muted" />
          <span class="text-survey-text-muted">数据源:</span>
          <span class="text-survey-text-primary font-mono">{{ caliberInfo.dataSource }}</span>
        </div>
      </div>
    </div>

    <div v-if="showDetails" class="border-t border-survey-border bg-survey-bg/50 p-4">
      <p class="text-xs font-medium text-survey-text-secondary mb-3">ClickHouse 原始记录校验规则命中情况</p>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          v-for="rule in caliberInfo.checkRules"
          :key="rule.name"
          class="bg-survey-surface rounded-lg p-3 border border-survey-border/50"
        >
          <p class="text-xs text-survey-text-secondary font-medium mb-2">{{ rule.name }}</p>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs flex items-center gap-1 text-survey-success">
                <CheckCircle class="w-3 h-3" />
                通过
              </span>
              <span class="text-xs font-mono text-survey-text-primary">{{ formatNumber(rule.passCount) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs flex items-center gap-1 text-survey-danger">
                <XCircle class="w-3 h-3" />
                命中
              </span>
              <span class="text-xs font-mono text-survey-text-primary">{{ formatNumber(rule.hitCount) }}</span>
            </div>
            <div class="w-full h-1 bg-survey-border rounded-full overflow-hidden mt-1.5">
              <div
                class="h-full bg-survey-primary rounded-full"
                :style="{ width: `${rule.passRate * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
