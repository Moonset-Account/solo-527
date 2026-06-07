<script lang="ts">
	let {
		title,
		value,
		subtitle = undefined,
		trend = undefined,
		trendValue = undefined
	}: {
		title: string;
		value: string | number;
		subtitle?: string;
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
	} = $props();
</script>

<div class="card p-5">
	<div class="text-sm text-gray-500 mb-1">{title}</div>
	<div class="flex items-baseline gap-2">
		<span class="text-2xl font-bold text-gray-800 font-mono">{value}</span>
		{#if trend && trendValue}
			<span
				class={`text-sm font-medium ${
					trend === 'up'
						? 'text-green-600'
						: trend === 'down'
							? 'text-red-600'
							: 'text-gray-500'
				}`}
			>
				{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
			</span>
		{/if}
	</div>
	{#if subtitle}
		<div class="text-xs text-gray-400 mt-1">{subtitle}</div>
	{/if}
</div>
