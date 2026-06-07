<script setup lang="ts">
import { computed } from 'vue';
import { TrendingUp, TrendingDown } from 'lucide-vue-next';

const props = defineProps<{
  title: string;
  value: number | string;
  unit?: string;
  isPercentage?: boolean;
  trend?: number;
  icon?: any;
  color?: string;
}>();

const displayValue = computed(() => {
  if (typeof props.value === 'string') return props.value;
  if (props.isPercentage) return `${(props.value * 100).toFixed(1)}%`;
  return props.value.toLocaleString();
});

const trendColor = computed(() => {
  if (!props.trend) return 'text-slate-500';
  return props.trend > 0 ? 'text-green-600' : 'text-red-600';
});
</script>

<template>
  <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-slate-500 font-medium">{{ title }}</p>
        <p class="text-3xl font-bold mt-2" :class="color || 'text-slate-800'">
          {{ displayValue }}
          <span v-if="unit" class="text-lg font-normal text-slate-500">{{ unit }}</span>
        </p>
        <div v-if="trend !== undefined" class="flex items-center gap-1 mt-2" :class="trendColor">
          <component :is="trend >= 0 ? TrendingUp : TrendingDown" class="w-4 h-4" />
          <span class="text-sm font-medium">{{ Math.abs(trend).toFixed(1) }}%</span>
          <span class="text-slate-500 text-xs">较上周</span>
        </div>
      </div>
      <div 
        v-if="icon" 
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        :class="[color ? color.replace('text-', 'bg-').replace('800', '100') : 'bg-blue-100', color ? color.replace('text-', 'text-').replace('800', '600') : 'text-blue-600']"
      >
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>
  </div>
</template>
