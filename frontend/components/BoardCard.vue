<template>
  <div class="board-card" :class="cardClass" @click="$emit('click')">
    <div class="bc-head">
      <n-tag :color="riskColor" text-color="#fff" size="small" bordered="false">{{ riskLabel }}</n-tag>
      <span class="bc-status" :class="statusClass">{{ statusLabel }}</span>
    </div>
    <div class="bc-title">{{ item.contract_name }}</div>
    <div class="bc-counterparty" v-if="item.counterparty">🏢 {{ item.counterparty }}</div>
    <div v-if="showDeadline" class="bc-deadline">
      <span>📅 {{ deadlineText }}</span>
      <span :class="dlClass">{{ dlLabel }}</span>
    </div>
    <div class="bc-gaps" v-if="item.gap_count > 0">
      <span v-if="item.critical_gap_count" class="gap-pill critical">🔴 {{ item.critical_gap_count }}</span>
      <span v-if="item.high_gap_count" class="gap-pill high">🟠 {{ item.high_gap_count }}</span>
      <span class="gap-pill info">共 {{ item.gap_count }} 缺口</span>
    </div>
    <div class="bc-gaps" v-else style="color:#18a058;font-weight:500;">
      ✅ 暂无缺口
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ item: any; showDeadline?: boolean }>()
defineEmits(['click'])

const riskColor = computed(() => ({ critical: '#d03050', high: '#f0a020', medium: '#1d6ff2', low: '#208080' } as any)[props.item.risk_level] || '#8a8f99')
const riskLabel = computed(() => ({ critical: '极高', high: '高', medium: '中', low: '低' } as any)[props.item.risk_level] || '-')

const statusLabel = computed(() => ({ draft: '草稿', submitted: '已提交', under_review: '审核中', lawyer_reviewed: '律师已审', reviewer_approved: '复核通过', rejected: '已驳回', closed: '已关闭' } as any)[props.item.status] || props.item.status)
const statusClass = computed(() => ({ draft: 'st-default', submitted: 'st-info', under_review: 'st-warning', lawyer_reviewed: 'st-primary', reviewer_approved: 'st-success', rejected: 'st-error', closed: 'st-default' } as any)[props.item.status] || '')

const cardClass = computed(() => {
  const dl = props.item.days_left
  if (dl === null) return 'bc-none'
  if (dl < 0) return 'bc-overdue'
  if (dl <= 3) return 'bc-urgent'
  if (dl <= 7) return 'bc-soon'
  return 'bc-safe'
})

const deadlineText = computed(() => props.item.deadline ? String(props.item.deadline).slice(0, 10) : '-')
const dlLabel = computed(() => {
  const dl = props.item.days_left
  if (dl === null) return ''
  if (dl < 0) return `超期${-dl}天`
  if (dl === 0) return '今天到期'
  return `剩${dl}天`
})
const dlClass = computed(() => {
  const dl = props.item.days_left
  if (dl === null) return ''
  if (dl < 0) return 'dl-overdue'
  if (dl <= 3) return 'dl-urgent'
  if (dl <= 7) return 'dl-soon'
  return 'dl-safe'
})
</script>

<style scoped>
.board-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  border-left: 4px solid #e5e7eb;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.board-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
.bc-overdue { border-left-color: #d03050; background: #fff5f6; }
.bc-urgent { border-left-color: #f0a020; background: #fffbf3; }
.bc-soon { border-left-color: #e0a020; background: #fffdf7; }
.bc-safe { border-left-color: #18a058; background: #f4fbf7; }
.bc-none { border-left-color: #9ca3af; background: #fff; }

.bc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.bc-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.st-default { background: #f3f4f6; color: #4b5563; }
.st-info { background: #dbeafe; color: #1d4ed8; }
.st-warning { background: #fef3c7; color: #b45309; }
.st-primary { background: #dbeafe; color: #1d4ed8; }
.st-success { background: #d1fae5; color: #047857; }
.st-error { background: #fee2e2; color: #b91c1c; }

.bc-title { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px; line-height: 1.4; }
.bc-counterparty { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
.bc-deadline { display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 8px; padding: 4px 8px; background: rgba(0,0,0,0.03); border-radius: 6px; }
.dl-overdue { color: #d03050; font-weight: 700; }
.dl-urgent { color: #f0a020; font-weight: 700; }
.dl-soon { color: #ca8a04; font-weight: 600; }
.dl-safe { color: #18a058; font-weight: 600; }

.bc-gaps { display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px; }
.gap-pill { padding: 2px 8px; border-radius: 10px; }
.gap-pill.critical { background: #fee2e2; color: #b91c1c; font-weight: 600; }
.gap-pill.high { background: #fef3c7; color: #b45309; font-weight: 600; }
.gap-pill.info { background: #f3f4f6; color: #4b5563; }
</style>
