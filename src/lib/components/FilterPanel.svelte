<script lang="ts">
	import { filters, filterOptions, resetFilters, activeFilterCount } from '$lib/stores/filters';
	import type { FilterOption } from '$lib/types';

	export let loading = false;
	export let onApply: () => void;

	let expandedSections: Record<string, boolean> = {
		activityTypes: true,
		communities: true,
		ageGroups: true,
		channels: true,
		weather: true
	};

	function toggleSection(key: string) {
		expandedSections[key] = !expandedSections[key];
	}

	function toggleFilter(key: keyof typeof $filters, value: string) {
		filters.update((f) => {
			const current = f[key] as string[];
			if (current.includes(value)) {
				return { ...f, [key]: current.filter((v) => v !== value) };
			} else {
				return { ...f, [key]: [...current, value] };
			}
		});
	}

	function isSelected(key: keyof typeof $filters, value: string): boolean {
		return ($filters[key] as string[]).includes(value);
	}

	const sectionLabels: Record<string, string> = {
		activityTypes: '活动类型',
		communities: '社区',
		ageGroups: '年龄段',
		channels: '渠道来源',
		weather: '天气情况'
	};
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
	<div class="flex items-center justify-between mb-4">
		<h3 class="font-semibold text-gray-800">筛选条件</h3>
		<span class="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
			{$activeFilterCount} 个筛选
		</span>
	</div>

	<div class="space-y-3">
		{#each Object.keys(sectionLabels) as sectionKey}
			<div class="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
				<button
					class="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
					on:click={() => toggleSection(sectionKey)}
				>
					<span>{sectionLabels[sectionKey]}</span>
					<svg
						class={`w-4 h-4 transition-transform ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if expandedSections[sectionKey]}
					<div class="mt-2 space-y-1 max-h-40 overflow-y-auto">
						{#each ($filterOptions[sectionKey as keyof typeof $filterOptions] as FilterOption[]) || [] as option}
							<label class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer py-1">
								<input
									type="checkbox"
									checked={isSelected(sectionKey as keyof typeof $filters, option.value)}
									on:change={() => toggleFilter(sectionKey as keyof typeof $filters, option.value)}
									class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
								/>
								<span class="truncate">{option.label}</span>
							</label>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		<div class="pt-3 space-y-2">
			<button
				class="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
				on:click={onApply}
				disabled={loading}
			>
				{loading ? '加载中...' : '应用筛选'}
			</button>
			<button
				class="w-full btn btn-secondary"
				on:click={() => {
					resetFilters();
					onApply();
				}}
			>
				重置筛选
			</button>
		</div>
	</div>
</div>
