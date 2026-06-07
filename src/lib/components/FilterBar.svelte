<script lang="ts">
	import { filterStore, activeFiltersCount, resetFilters, showToast, savedViewsStore } from '$lib/stores';
	import type { FilterState, SavedView } from '$lib/types';
	import { Filter, X, Save } from 'lucide-svelte';
	import { get } from 'svelte/store';

	export let vehicles: Array<{ id: string; label: string }> = [];
	export let customers: Array<{ id: string; label: string }> = [];
	export let routes: Array<{ id: string; label: string }> = [];
	export let anomalyTypes: Array<{ key: string; label: string }> = [];
	export let severityLevels: Array<{ key: string; label: string }> = [];

	let showSaveDialog = false;
	let viewName = '';

	function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]): void {
		filterStore.update((filters) => ({ ...filters, [key]: value }));
	}

	function removeFilter(key: keyof FilterState): void {
		if (key === 'dateRange') {
			filterStore.update((f) => ({ ...f, dateRange: undefined }));
		} else {
			filterStore.update((f) => ({ ...f, [key]: [] }));
		}
	}

	function handleSelectChange(e: Event, key: keyof FilterState): void {
		const target = e.target as HTMLSelectElement;
		const values = Array.from(target.selectedOptions).map((o) => o.value);
		updateFilter(key, values as any);
	}

	function handleInputChange(e: Event, key: keyof FilterState): void {
		const target = e.target as HTMLInputElement;
		const values = target.value.split(',').filter(Boolean);
		updateFilter(key, values as any);
	}

	function handleSaveView(): void {
		if (!viewName.trim()) return;

		const filters = get(filterStore);
		const newView: SavedView = {
			id: 'view_' + Date.now(),
			name: viewName,
			page: typeof window !== 'undefined' ? window.location.pathname : '/dashboard',
			filters,
			createdBy: 'admin',
			createdAt: new Date().toISOString()
		};

		savedViewsStore.update((views) => [...views, newView]);

		try {
			localStorage.setItem('savedViews', JSON.stringify(get(savedViewsStore)));
		} catch (e) {
			console.warn('Failed to save views to localStorage:', e);
		}

		showSaveDialog = false;
		viewName = '';
		showToast('视图保存成功', 'success');
	}
</script>

<div class="card mb-6">
	<div class="card-header flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Filter class="w-5 h-5 text-slate-500" />
			<span class="font-medium text-slate-800">筛选条件</span>
			{#if $activeFiltersCount > 0}
				<span class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-primary-500 rounded-full">
					{$activeFiltersCount}
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<button
				on:click={() => (showSaveDialog = true)}
				class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
			>
				<Save class="w-4 h-4" />
				保存视图
			</button>
			<button
				on:click={resetFilters}
				class="text-sm text-slate-500 hover:text-slate-700"
			>
				重置
			</button>
		</div>
	</div>
	<div class="card-body">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div>
				<label class="block text-xs font-medium text-slate-500 mb-1">车辆</label>
				<select
					class="select"
					multiple
					value={$filterStore.vehicleIds}
					on:change={(e) => handleSelectChange(e, 'vehicleIds')}
				>
					{#each vehicles as v}
						<option value={v.id}>{v.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-500 mb-1">客户</label>
				<select
					class="select"
					multiple
					value={$filterStore.customerIds}
					on:change={(e) => handleSelectChange(e, 'customerIds')}
				>
					{#each customers as c}
						<option value={c.id}>{c.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-500 mb-1">路线</label>
				<select
					class="select"
					multiple
					value={$filterStore.routeIds}
					on:change={(e) => handleSelectChange(e, 'routeIds')}
				>
					{#each routes as r}
						<option value={r.id}>{r.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-500 mb-1">异常类型</label>
				<select
					class="select"
					multiple
					value={$filterStore.anomalyTypes}
					on:change={(e) => handleSelectChange(e, 'anomalyTypes')}
				>
					{#each anomalyTypes as t}
						<option value={t.key}>{t.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-500 mb-1">严重程度</label>
				<select
					class="select"
					multiple
					value={$filterStore.severityLevels}
					on:change={(e) => handleSelectChange(e, 'severityLevels')}
				>
					{#each severityLevels as s}
						<option value={s.key}>{s.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-500 mb-1">批次号</label>
				<input
					type="text"
					class="input"
					placeholder="输入批次号搜索"
					value={$filterStore.batchNos.join(',')}
					on:input={(e) => handleInputChange(e, 'batchNos')}
				/>
			</div>
		</div>

		{#if $activeFiltersCount > 0}
			<div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
				<span class="text-xs text-slate-500">已选条件:</span>
				{#if $filterStore.vehicleIds.length > 0}
					<span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded">
						车辆 ({$filterStore.vehicleIds.length})
						<button on:click={() => removeFilter('vehicleIds')}><X class="w-3 h-3" /></button>
					</span>
				{/if}
				{#if $filterStore.customerIds.length > 0}
					<span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
						客户 ({$filterStore.customerIds.length})
						<button on:click={() => removeFilter('customerIds')}><X class="w-3 h-3" /></button>
					</span>
				{/if}
				{#if $filterStore.routeIds.length > 0}
					<span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded">
						路线 ({$filterStore.routeIds.length})
						<button on:click={() => removeFilter('routeIds')}><X class="w-3 h-3" /></button>
					</span>
				{/if}
				{#if $filterStore.anomalyTypes.length > 0}
					<span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded">
						异常类型 ({$filterStore.anomalyTypes.length})
						<button on:click={() => removeFilter('anomalyTypes')}><X class="w-3 h-3" /></button>
					</span>
				{/if}
				{#if $filterStore.severityLevels.length > 0}
					<span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded">
						严重程度 ({$filterStore.severityLevels.length})
						<button on:click={() => removeFilter('severityLevels')}><X class="w-3 h-3" /></button>
					</span>
				{/if}
				{#if $filterStore.batchNos.length > 0}
					<span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-cyan-50 text-cyan-700 rounded">
						批次号 ({$filterStore.batchNos.length})
						<button on:click={() => removeFilter('batchNos')}><X class="w-3 h-3" /></button>
					</span>
				{/if}
			</div>
		{/if}
	</div>

	{#if showSaveDialog}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={() => (showSaveDialog = false)}>
			<div class="bg-white rounded-lg p-6 w-96 shadow-xl" on:click|stopPropagation>
				<h3 class="text-lg font-semibold text-slate-800 mb-4">保存视图</h3>
				<input
					type="text"
					class="input mb-4"
					placeholder="输入视图名称"
					bind:value={viewName}
					on:keydown={(e) => e.key === 'Enter' && handleSaveView()}
				/>
				<div class="flex justify-end gap-2">
					<button class="btn btn-secondary" on:click={() => (showSaveDialog = false)}>取消</button>
					<button class="btn btn-primary" on:click={handleSaveView}>保存</button>
				</div>
			</div>
		</div>
	{/if}
</div>
