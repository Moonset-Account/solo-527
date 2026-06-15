<template>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px">
    <NCard
      v-for="card in cards"
      :key="card.key"
      :style="{ borderLeft: `4px solid ${card.color}` }"
      hoverable
    >
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div>
          <div style="font-size: 14px; color: #718096; margin-bottom: 8px">{{ card.label }}</div>
          <div style="font-size: 28px; font-weight: 700; color: #1a365d">{{ card.value }}</div>
        </div>
        <div :style="{ width: '48px', height: '48px', borderRadius: '12px', background: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }">
          {{ card.icon }}
        </div>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'

const props = defineProps<{
  pending: number
  rectifying: number
  reviewing: number
  closed: number
}>()

const cards = computed(() => [
  { key: 'pending', label: '待整改', value: props.pending, color: '#3182ce', bgColor: '#ebf8ff', icon: '📋' },
  { key: 'rectifying', label: '整改中', value: props.rectifying, color: '#ed8936', bgColor: '#fefcbf', icon: '🔧' },
  { key: 'reviewing', label: '复查中', value: props.reviewing, color: '#805ad5', bgColor: '#faf5ff', icon: '🔍' },
  { key: 'closed', label: '已闭环', value: props.closed, color: '#38a169', bgColor: '#f0fff4', icon: '✅' }
])
</script>
