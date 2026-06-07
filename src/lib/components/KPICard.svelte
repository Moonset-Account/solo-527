<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { TrendingUp, TrendingDown } from 'lucide-svelte';

	export let title: string;
	export let value: string | number;
	export let icon: typeof SvelteComponent;
	export let trend: number | undefined = undefined;
	export let trendLabel: string | undefined = undefined;
	export let color: string = 'primary';
	export let subtitle: string | undefined = undefined;

	const colorClasses: Record<string, string> = {
		primary: 'bg-primary-50 text-primary-600',
		green: 'bg-green-50 text-green-600',
		red: 'bg-red-50 text-red-600',
		yellow: 'bg-yellow-50 text-yellow-600',
		purple: 'bg-purple-50 text-purple-600',
		cyan: 'bg-cyan-50 text-cyan-600'
	};
</script>

<div class="card p-6">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<p class="text-sm font-medium text-slate-500">{title}</p>
			<p class="text-3xl font-bold text-slate-800 mt-2 font-mono">{value}</p>
			{#if subtitle}
				<p class="text-xs text-slate-400 mt-1">{subtitle}</p>
			{/if}
			{#if trend !== undefined}
				<div class="flex items-center gap-1 mt-3">
					{#if trend >= 0}
						<TrendingUp class="w-4 h-4 text-green-500" />
						<span class="text-sm font-medium text-green-600">+{trend.toFixed(1)}%</span>
					{:else}
						<TrendingDown class="w-4 h-4 text-red-500" />
						<span class="text-sm font-medium text-red-600">{trend.toFixed(1)}%</span>
					{/if}
					{#if trendLabel}
						<span class="text-xs text-slate-400 ml-1">{trendLabel}</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="w-12 h-12 rounded-xl {colorClasses[color] || colorClasses.primary} flex items-center justify-center flex-shrink-0">
			<svelte:component this={icon} class="w-6 h-6" />
		</div>
	</div>
</div>
