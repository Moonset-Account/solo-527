<script lang="ts">
	import { filterStore, resetFilter, isFilterActive } from '$lib/stores';
	import { DISTRICTS, PLANT_TYPES, TASK_TYPES, TEAMS, type FilterState } from '$lib/types';
	import { RotateCcw, Filter, ChevronDown, ChevronUp } from 'lucide-svelte';

	let collapsed = $state(false);
	let districts = $state<string[]>([]);
	let plantTypes = $state<string[]>([]);
	let taskTypes = $state<string[]>([]);
	let teams = $state<string[]>([]);
	let dateFrom = $state('');
	let dateTo = $state('');

	function toggleItem(arr: string[], item: string): string[] {
		return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
	}

	function apply() {
		filterStore.set({ districts, plantTypes, taskTypes, teams, dateRange: [dateFrom, dateTo] });
	}

	function reset() {
		districts = [];
		plantTypes = [];
		taskTypes = [];
		teams = [];
		dateFrom = '';
		dateTo = '';
		resetFilter();
	}

	$effect(() => {
		apply();
	});

	function ToggleGroup({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (item: string) => void }) {
		return '';
	}
</script>

<aside class="bg-white border-r border-gray-200 flex flex-col" class:w-64={!collapsed} class:w-12={collapsed}>
	<div class="flex items-center justify-between p-3 border-b border-gray-100">
		{#if !collapsed}
			<div class="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
				<Filter size={16} />
				筛选条件
			</div>
		{/if}
		<button onclick={() => (collapsed = !collapsed)} class="p-1 hover:bg-gray-100 rounded cursor-pointer">
			{#if collapsed}<ChevronDown size={16} />{:else}<ChevronUp size={16} />{/if}
		</button>
	</div>

	{#if !collapsed}
		<div class="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
			<div>
				<div class="font-medium text-gray-700 mb-1.5">片区</div>
				<div class="flex flex-wrap gap-1">
					{#each DISTRICTS as d}
						<button
							class="px-2 py-1 rounded border transition-colors cursor-pointer {districts.includes(d) ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#40916C]'}"
							onclick={() => (districts = toggleItem(districts, d))}
						>
							{d}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<div class="font-medium text-gray-700 mb-1.5">植物类型</div>
				<div class="flex flex-wrap gap-1">
					{#each PLANT_TYPES as p}
						<button
							class="px-2 py-1 rounded border transition-colors cursor-pointer {plantTypes.includes(p) ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#40916C]'}"
							onclick={() => (plantTypes = toggleItem(plantTypes, p))}
						>
							{p}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<div class="font-medium text-gray-700 mb-1.5">任务类型</div>
				<div class="flex flex-wrap gap-1">
					{#each TASK_TYPES as t}
						<button
							class="px-2 py-1 rounded border transition-colors cursor-pointer {taskTypes.includes(t) ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#40916C]'}"
							onclick={() => (taskTypes = toggleItem(taskTypes, t))}
						>
							{t}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<div class="font-medium text-gray-700 mb-1.5">班组</div>
				<div class="flex flex-wrap gap-1">
					{#each TEAMS as t}
						<button
							class="px-2 py-1 rounded border transition-colors cursor-pointer {teams.includes(t) ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#40916C]'}"
							onclick={() => (teams = toggleItem(teams, t))}
						>
							{t}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<div class="font-medium text-gray-700 mb-1.5">日期范围</div>
				<input type="date" bind:value={dateFrom} class="w-full border border-gray-200 rounded px-2 py-1 text-xs mb-1" />
				<input type="date" bind:value={dateTo} class="w-full border border-gray-200 rounded px-2 py-1 text-xs" />
			</div>

			<button
				onclick={reset}
				class="flex items-center justify-center gap-1.5 w-full py-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
			>
				<RotateCcw size={14} />
				重置筛选
			</button>

			{#if $isFilterActive}
				<div class="text-[10px] text-[#40916C] font-medium">✓ 筛选已激活</div>
			{/if}
		</div>
	{/if}
</aside>
