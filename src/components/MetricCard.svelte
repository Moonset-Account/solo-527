<script lang="ts">
	import { ArrowUp, ArrowDown, Minus } from 'lucide-svelte';
	import MetricDefinition from './MetricDefinition.svelte';

	export let label: string;
	export let value: string | number;
	export let unit = '';
	export let trend: number | undefined = undefined;
	export let metricKey: string | undefined = undefined;
	export let color: 'default' | 'success' | 'warning' | 'danger' = 'default';

	const colorClasses = {
		default: 'text-gray-900',
		success: 'text-success',
		warning: 'text-warning',
		danger: 'text-danger'
	};
</script>

<div class="metric-card">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm text-gray-500">{label}</p>
			<p class="text-2xl font-bold mt-1 {colorClasses[color]}">
				{value}
				{#if unit}
					<span class="text-sm font-normal text-gray-500 ml-1">{unit}</span>
				{/if}
			</p>
			{#if trend !== undefined}
				<div class="flex items-center mt-2 text-sm">
					{#if trend > 0}
						<ArrowUp class="w-4 h-4 text-danger" />
						<span class="text-danger">+{trend.toFixed(1)}%</span>
					{:else if trend < 0}
						<ArrowDown class="w-4 h-4 text-success" />
						<span class="text-success">{trend.toFixed(1)}%</span>
					{:else}
						<Minus class="w-4 h-4 text-gray-400" />
						<span class="text-gray-500">持平</span>
					{/if}
					<span class="text-gray-400 ml-1">较上周</span>
				</div>
			{/if}
		</div>
		{#if metricKey}
			<MetricDefinition {metricKey} compact />
		{/if}
	</div>
</div>
