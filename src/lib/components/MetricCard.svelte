<script lang="ts">
	import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';

	let { label, value, unit = '', trend, trendValue, color = '#1B4332' }: {
		label: string;
		value: number | string;
		unit?: string;
		trend?: 'up' | 'down' | 'flat';
		trendValue?: number;
		color?: string;
	} = $props();

	const trendColor = $derived(
		trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400'
	);
</script>

<div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
	<div class="text-xs text-gray-500 mb-1">{label}</div>
	<div class="flex items-end gap-2">
		<span class="text-2xl font-bold" style="color: {color}">{value}</span>
		{#if unit}
			<span class="text-xs text-gray-400 mb-1">{unit}</span>
		{/if}
	</div>
	{#if trend && trendValue !== undefined}
		<div class="flex items-center gap-1 mt-1 {trendColor}">
			{#if trend === 'up'}
				<TrendingUp size={12} />
			{:else if trend === 'down'}
				<TrendingDown size={12} />
			{:else}
				<Minus size={12} />
			{/if}
			<span class="text-[10px]">{trendValue}%</span>
		</div>
	{/if}
</div>
