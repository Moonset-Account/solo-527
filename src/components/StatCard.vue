<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  value: string | number
  icon: any
  trend?: number
  suffix?: string
}>()

const trendUp = computed(() => props.trend !== undefined && props.trend > 0)
const trendDown = computed(() => props.trend !== undefined && props.trend < 0)
const trendColor = computed(() => {
  if (trendUp.value) return 'text-danger-400'
  if (trendDown.value) return 'text-accent-400'
  return 'text-primary-400'
})
</script>

<template>
  <div class="card card-hover stat-card">
    <div class="stat-header">
      <div class="stat-icon-wrap">
        <component :is="icon" :size="20" class="text-accent-400" />
      </div>
      <div v-if="trend !== undefined" class="stat-trend" :class="trendColor">
        <TrendingUp v-if="trendUp" :size="14" />
        <TrendingDown v-else-if="trendDown" :size="14" />
        <span class="font-data text-xs">{{ Math.abs(trend) }}%</span>
      </div>
    </div>
    <div class="stat-value font-data">{{ value }}<span v-if="suffix" class="stat-suffix">{{ suffix }}</span></div>
    <div class="stat-title">{{ title }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  min-width: 0;
}
.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(13, 148, 136, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-bottom: 4px;
}
.stat-suffix {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: 4px;
}
.stat-title {
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
