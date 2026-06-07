<script lang="ts">
	import KPICard from './KPICard.svelte';

	export let metrics: Array<{
		title: string;
		value: string;
		change?: number;
		changeLabel?: string;
		variant?: 'default' | 'success' | 'warning' | 'danger';
	}> = [];
</script>

<div class="grid grid-cols-6 gap-4">
	{#each metrics as metric}
		<KPICard
			title={metric.title}
			value={metric.value}
			change={metric.change}
			changeLabel={metric.changeLabel || '环比'}
			variant={metric.variant || 'default'}
		/>
	{/each}
</div>
