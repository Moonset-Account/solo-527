<script lang="ts">
	import { ArrowUpRight, ArrowDownRight } from 'lucide-svelte';

	export let title: string;
	export let value: string;
	export let change?: number;
	export let changeLabel = '环比';
	export let icon?: string;
	export let variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

	const variantClasses = {
		default: 'border-slate-200',
		success: 'border-green-200 bg-green-50/50',
		warning: 'border-amber-200 bg-amber-50/50',
		danger: 'border-red-200 bg-red-50/50'
	};
</script>

<div class="card border-l-4 {variantClasses[variant]}">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm font-medium text-slate-500">{title}</p>
			<p class="mt-2 text-2xl font-bold font-mono text-slate-900">{value}</p>
			{#if change !== undefined}
				<div class="mt-2 flex items-center gap-1 text-sm">
					{#if change >= 0}
						<ArrowUpRight class="w-4 h-4 text-red-500" />
						<span class="text-red-600 font-medium">{(change * 100).toFixed(1)}%</span>
					{:else}
						<ArrowDownRight class="w-4 h-4 text-green-500" />
						<span class="text-green-600 font-medium">{Math.abs(change * 100).toFixed(1)}%</span>
					{/if}
					<span class="text-slate-400">{changeLabel}</span>
				</div>
			{/if}
		</div>
		{#if icon}
			<div class="text-slate-400">
				{icon}
			</div>
		{/if}
	</div>
</div>
