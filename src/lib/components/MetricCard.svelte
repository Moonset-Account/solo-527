<script lang="ts">
  import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
  import { formatNumber, formatPercent, formatSignedPercent } from '$utils';

  export let name: string;
  export let value: number;
  export let unit: string = '';
  export let change: number = 0;
  export let changeLabel: string = '环比';
  export let trendData: number[] = [];
  export let delay: number = 0;

  $: isPositive = change > 0;
  $: isNegative = change < 0;
  $: isNeutral = change === 0;

  $: formattedValue = unit === '%' 
    ? formatPercent(value, 2) 
    : formatNumber(value, value >= 1000 ? 0 : 2);
</script>

<div 
  class="card card-hover p-5 animate-fade-in-up"
  style="animation-delay: {delay}ms; opacity: 0;"
>
  <div class="flex items-start justify-between mb-3">
    <div>
      <p class="text-sm font-medium text-slate-500">{name}</p>
      <p class="mt-1 text-2xl font-bold text-slate-900 font-mono tracking-tight">
        {formattedValue}
        {#if unit && unit !== '%'}
          <span class="text-base font-normal text-slate-500 ml-1">{unit}</span>
        {/if}
      </p>
    </div>
    <div 
      class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
      class:bg-accent-50={isPositive}
      class:text-accent-700={isPositive}
      class:bg-danger-50={isNegative}
      class:text-danger-700={isNegative}
      class:bg-slate-100={isNeutral}
      class:text-slate-600={isNeutral}
    >
      {#if isPositive}
        <TrendingUp class="w-3.5 h-3.5" />
      {:else if isNegative}
        <TrendingDown class="w-3.5 h-3.5" />
      {:else}
        <Minus class="w-3.5 h-3.5" />
      {/if}
      {formatSignedPercent(change, 2)}
    </div>
  </div>

  {#if trendData.length > 0}
    <div class="h-12 flex items-end gap-0.5">
      {#each trendData as v, i}
        <div 
          class="flex-1 rounded-sm transition-all duration-300"
          class:bg-primary-200={i < trendData.length - 1}
          class:bg-primary-500={i === trendData.length - 1}
          style="height: {Math.max(v * 100, 8)}%"
        ></div>
      {/each}
    </div>
    <p class="mt-2 text-xs text-slate-400">{changeLabel}</p>
  {/if}
</div>
