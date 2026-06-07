<script lang="ts">
	import type { DimensionType } from '@/lib/types';
	import { getDimensionLabel } from '@/lib/utils/format';
	import { BarChart3 } from 'lucide-svelte';

	export let selected: DimensionType = 'intent';

	const dimensions: { value: DimensionType; label: string }[] = [
		{ value: 'intent', label: '意图标签' },
		{ value: 'channel', label: '渠道' },
		{ value: 'hour', label: '时段' },
		{ value: 'level', label: '客户等级' },
		{ value: 'version', label: '版本' }
	];
</script>

<div class="flex items-center gap-3">
	<div class="flex items-center gap-2 text-slate-600">
		<BarChart3 class="w-5 h-5" />
		<span class="font-medium">分析维度:</span>
	</div>
	<div class="flex bg-slate-100 rounded-lg p-1">
		{#each dimensions as dim}
			<button
				onclick={() => (selected = dim.value)}
				class="px-4 py-1.5 text-sm font-medium rounded-md transition-all {selected === dim.value
					? 'bg-white text-primary-600 shadow-sm'
					: 'text-slate-600 hover:text-slate-900'}"
			>
				{dim.label}
			</button>
		{/each}
	</div>
</div>
