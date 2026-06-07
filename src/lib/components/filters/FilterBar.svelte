<script lang="ts">
	import { filterStore, activeFilterCount } from '@/lib/stores/filterStore';
	import { getDistinctValues } from '@/lib/utils/queryService';
	import { getLevelLabel, getChannelLabel } from '@/lib/utils/format';
	import { Calendar, Filter, X } from 'lucide-svelte';

	const { intents, channels, versions, customerLevels } = getDistinctValues();

	let filters = $state($filterStore);
	let showFilters = $state(false);

	$effect(() => {
		filters = $filterStore;
	});

	function handleDateChange(type: 'start' | 'end', value: string) {
		if (type === 'start') {
			filterStore.setDateRange(value, filters.endDate);
		} else {
			filterStore.setDateRange(filters.startDate, value);
		}
	}

	function handleMultiSelectChange(
		field: 'channels' | 'versions' | 'customerLevels' | 'intentTags',
		value: string
	) {
		const current = filters[field];
		const updated = current.includes(value)
			? current.filter((v) => v !== value)
			: [...current, value];

		switch (field) {
			case 'channels':
				filterStore.setChannels(updated);
				break;
			case 'versions':
				filterStore.setVersions(updated);
				break;
			case 'customerLevels':
				filterStore.setCustomerLevels(updated);
				break;
			case 'intentTags':
				filterStore.setIntentTags(updated);
				break;
		}
	}

	function resetFilters() {
		filterStore.reset();
	}
</script>

<div class="bg-white rounded-xl shadow-card border border-slate-100 p-4 mb-6">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<Calendar class="w-5 h-5 text-slate-400" />
				<input
					type="date"
					class="input max-w-[160px]"
					value={filters.startDate}
					oninput={(e) => handleDateChange('start', e.target.value)}
				/>
				<span class="text-slate-400">至</span>
				<input
					type="date"
					class="input max-w-[160px]"
					value={filters.endDate}
					oninput={(e) => handleDateChange('end', e.target.value)}
				/>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="btn btn-outline flex items-center gap-2"
				onclick={() => (showFilters = !showFilters)}
			>
				<Filter class="w-4 h-4" />
				高级筛选
				{#if $activeFilterCount > 0}
					<span class="badge badge-info">{$activeFilterCount}</span>
				{/if}
			</button>
			{#if $activeFilterCount > 0}
				<button class="btn btn-secondary" onclick={resetFilters}>
					<X class="w-4 h-4 inline mr-1" />
					重置
				</button>
			{/if}
		</div>
	</div>

	{#if showFilters}
		<div class="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-fade-in">
			<div>
				<label class="block text-sm font-medium text-slate-600 mb-2">渠道</label>
				<div class="space-y-1">
					{#each channels as channel}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.channels.includes(channel)}
								onchange={() => handleMultiSelectChange('channels', channel)}
								class="rounded text-primary-500 focus:ring-primary-500"
							/>
							<span class="text-sm text-slate-700">{getChannelLabel(channel)}</span>
						</label>
					{/each}
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-600 mb-2">版本</label>
				<div class="space-y-1">
					{#each versions as version}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.versions.includes(version)}
								onchange={() => handleMultiSelectChange('versions', version)}
								class="rounded text-primary-500 focus:ring-primary-500"
							/>
							<span class="text-sm text-slate-700">{version}</span>
						</label>
					{/each}
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-600 mb-2">客户等级</label>
				<div class="space-y-1">
					{#each customerLevels as level}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.customerLevels.includes(level)}
								onchange={() => handleMultiSelectChange('customerLevels', level)}
								class="rounded text-primary-500 focus:ring-primary-500"
							/>
							<span class="text-sm text-slate-700">{getLevelLabel(level)}</span>
						</label>
					{/each}
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-600 mb-2">意图标签</label>
				<div class="space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin pr-2">
					{#each intents as intent}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.intentTags.includes(intent)}
								onchange={() => handleMultiSelectChange('intentTags', intent)}
								class="rounded text-primary-500 focus:ring-primary-500"
							/>
							<span class="text-sm text-slate-700 truncate">{intent}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
