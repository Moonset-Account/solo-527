<script lang="ts">
  import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';

  export let label: string;
  export let value: string | number;
  export let delta: number = 0;
  export let accent: 'navy' | 'amber' | 'warn' | 'success' = 'navy';
  export let iconComponent: any = null;

  const accentBg: Record<string, string> = {
    navy: 'from-navy-50 to-white',
    amber: 'from-amber-gold-50 to-white',
    warn: 'from-warn-orange-50 to-white',
    success: 'from-success-green-50 to-white'
  };

  const accentIconBg: Record<string, string> = {
    navy: 'bg-navy-100 text-navy-600',
    amber: 'bg-amber-gold-100 text-amber-gold-700',
    warn: 'bg-warn-orange-100 text-warn-orange-700',
    success: 'bg-success-green-100 text-success-green-700'
  };
</script>

<div
  class="card card-hover p-5 bg-gradient-to-br {accentBg[accent]} animate-fade-in-up"
  style="animation-delay: 0.05s"
>
  <div class="flex items-start justify-between">
    <div class="min-w-0">
      <p class="text-sm text-navy-500">{label}</p>
      <p class="mt-2 font-display text-3xl text-navy-900 leading-tight">{value}</p>
    </div>
    {#if iconComponent}
      <div
        class="w-11 h-11 rounded-xl flex items-center justify-center {accentIconBg[accent]}"
      >
        <svelte:component this={iconComponent} class="w-5 h-5" stroke-width={1.8} />
      </div>
    {/if}
  </div>

  {#if delta !== 0}
    <div class="mt-3 flex items-center gap-1.5 text-xs">
      {#if delta > 0}
        <TrendingUp class="w-3.5 h-3.5 text-success-green-600" stroke-width={2} />
        <span class="font-medium text-success-green-700">+{delta}%</span>
      {:else if delta < 0}
        <TrendingDown class="w-3.5 h-3.5 text-warn-orange-600" stroke-width={2} />
        <span class="font-medium text-warn-orange-700">{delta}%</span>
      {:else}
        <Minus class="w-3.5 h-3.5 text-navy-500" stroke-width={2} />
        <span class="font-medium text-navy-600">持平</span>
      {/if}
      <span class="text-navy-400">较上周期</span>
    </div>
  {/if}
</div>
