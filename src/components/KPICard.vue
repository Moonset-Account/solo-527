<script setup lang="ts">
import { TrendingUp, TrendingDown, Users, Clock, TicketCheck, DollarSign } from 'lucide-vue-next';
import { computed } from 'vue';
import { formatNumber } from '@/data/cleaner';

interface Props {
  title: string;
  value: number | string;
  change?: number;
  icon: 'users' | 'clock' | 'ticket' | 'dollar';
  suffix?: string;
  decimals?: number;
}

const props = withDefaults(defineProps<Props>(), {
  suffix: '',
  decimals: 0
});

const iconComponent = computed(() => {
  const icons = { users: Users, clock: Clock, ticket: TicketCheck, dollar: DollarSign };
  return icons[props.icon];
});

const isPositive = computed(() => props.change !== undefined && props.change >= 0);
const displayValue = computed(() => {
  if (typeof props.value === 'string') return props.value;
  return formatNumber(props.value, props.decimals);
});
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-slate-500 mb-1">{{ title }}</p>
        <p class="text-2xl font-bold text-slate-800 tracking-tight">
          {{ displayValue }}{{ suffix }}
        </p>
        <div v-if="change !== undefined" class="flex items-center mt-2">
          <component
            :is="isPositive ? TrendingUp : TrendingDown"
            :class="isPositive ? 'text-emerald-600' : 'text-rose-600'"
            class="w-4 h-4 mr-1"
          />
          <span
            :class="isPositive ? 'text-emerald-600' : 'text-rose-600'"
            class="text-sm font-medium"
          >
            {{ Math.abs(change).toFixed(1) }}%
          </span>
          <span class="text-slate-400 text-sm ml-1">较昨日</span>
        </div>
      </div>
      <div class="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center">
        <component :is="iconComponent" class="w-6 h-6 text-teal-700" />
      </div>
    </div>
  </div>
</template>
