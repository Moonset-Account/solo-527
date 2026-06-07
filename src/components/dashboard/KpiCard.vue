<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';

const props = defineProps<{
  title: string;
  value: number | string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  accent?: 'default' | 'warning' | 'danger' | 'success';
}>();

const displayValue = ref(0);
const targetValue = computed(() => typeof props.value === 'number' ? props.value : 0);

function animateValue() {
  const start = displayValue.value;
  const end = targetValue.value;
  const duration = 800;
  const startTime = performance.now();

  function step(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    displayValue.value = Math.round(start + (end - start) * easeOut);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

watch(() => props.value, () => {
  if (typeof props.value === 'number') {
    animateValue();
  }
});

onMounted(() => {
  if (typeof props.value === 'number') {
    animateValue();
  }
});

const accentClass = computed(() => {
  switch (props.accent) {
    case 'danger': return 'text-[var(--color-danger)]';
    case 'warning': return 'text-[var(--color-warning)]';
    case 'success': return 'text-[var(--color-success)]';
    default: return 'text-[var(--color-accent-light)]';
  }
});

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return n.toLocaleString('zh-CN');
  return n.toString();
};
</script>

<template>
  <div class="kpi-card">
    <div class="text-sm text-[var(--color-text-secondary)] mb-2">{{ title }}</div>
    <div class="flex items-baseline gap-2">
      <span class="text-3xl font-bold number-scroll" :class="accentClass">
        {{ typeof value === 'number' ? formatNum(displayValue) : value }}
      </span>
      <span v-if="suffix" class="text-sm text-[var(--color-text-muted)]">{{ suffix }}</span>
    </div>
    <div v-if="trend !== undefined" class="mt-2 flex items-center gap-1 text-xs">
      <span :class="trend >= 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'">
        {{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
      <span class="text-[var(--color-text-muted)]" v-if="trendLabel">{{ trendLabel }}</span>
    </div>
  </div>
</template>
