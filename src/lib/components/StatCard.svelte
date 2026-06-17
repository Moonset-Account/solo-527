<script lang="ts">
	import type { SvelteComponent } from 'svelte';

	let {
		title,
		value,
		icon,
		trend,
		trendUp = true,
		color = 'primary'
	}: {
		title: string;
		value: string | number;
		icon: typeof SvelteComponent;
		trend?: string;
		trendUp?: boolean;
		color?: 'primary' | 'secondary' | 'success' | 'warning';
	} = $props();

	const colorClasses: Record<string, string> = {
		primary: 'from-primary/10 to-primary/5 text-primary',
		secondary: 'from-secondary/10 to-secondary/5 text-secondary',
		success: 'from-success/10 to-success/5 text-success',
		warning: 'from-warning/10 to-warning/5 text-warning'
	};

	const iconBgClasses: Record<string, string> = {
		primary: 'bg-primary text-white',
		secondary: 'bg-secondary text-white',
		success: 'bg-success text-white',
		warning: 'bg-warning text-white'
	};
</script>

<div class="card p-5 overflow-hidden relative">
	<div class="absolute inset-0 bg-gradient-to-br {colorClasses[color]} opacity-50" />
	<div class="relative flex items-start justify-between">
		<div>
			<p class="text-sm text-text-muted mb-1">{title}</p>
			<p class="text-2xl font-semibold text-text-primary">{value}</p>
			{#if trend}
				<p class="text-xs mt-2 flex items-center gap-1 {trendUp ? 'text-success' : 'text-danger'}">
					{trendUp ? '↑' : '↓'} {trend}
				</p>
			{/if}
		</div>
		<div class="w-12 h-12 {iconBgClasses[color]} rounded-xl flex items-center justify-center shadow-md">
			<svelte:component this={icon} class="w-6 h-6" />
		</div>
	</div>
</div>
