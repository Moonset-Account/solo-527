<script lang="ts">
	import { departments, timeSlots, patientTypes, processNodes } from '$lib/dictionary';
	import { Filter, X, ChevronDown, ChevronUp } from 'lucide-svelte';
	import type { FilterParams, PatientType, ProcessNode } from '$types';

	export let filters: Partial<FilterParams> = {
		departments: [],
		doctors: [],
		timeSlots: [],
		patientTypes: [],
		processNodes: [],
		excludeAnomalies: true
	};

	export let onFilterChange: (filters: Partial<FilterParams>) => void = () => {};

	let expanded = true;
	let doctors = ['张医生', '李医生', '王医生', '刘医生', '陈医生', '杨医生', '赵医生', '黄医生'];

	function toggleDepartment(dept: string) {
		const current = filters.departments || [];
		const updated = current.includes(dept) ? current.filter((d) => d !== dept) : [...current, dept];
		filters = { ...filters, departments: updated };
		onFilterChange(filters);
	}

	function toggleDoctor(doc: string) {
		const current = filters.doctors || [];
		const updated = current.includes(doc) ? current.filter((d) => d !== doc) : [...current, doc];
		filters = { ...filters, doctors: updated };
		onFilterChange(filters);
	}

	function toggleTimeSlot(slot: string) {
		const current = filters.timeSlots || [];
		const updated = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
		filters = { ...filters, timeSlots: updated };
		onFilterChange(filters);
	}

	function togglePatientType(type: PatientType) {
		const current = filters.patientTypes || [];
		const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
		filters = { ...filters, patientTypes: updated };
		onFilterChange(filters);
	}

	function toggleProcessNode(node: ProcessNode) {
		const current = filters.processNodes || [];
		const updated = current.includes(node) ? current.filter((n) => n !== node) : [...current, node];
		filters = { ...filters, processNodes: updated };
		onFilterChange(filters);
	}

	function toggleExcludeAnomalies() {
		filters = { ...filters, excludeAnomalies: !filters.excludeAnomalies };
		onFilterChange(filters);
	}

	function clearAll() {
		filters = {
			departments: [],
			doctors: [],
			timeSlots: [],
			patientTypes: [],
			processNodes: [],
			excludeAnomalies: true
		};
		onFilterChange(filters);
	}

	function hasActiveFilters(): boolean {
		return (
			(filters.departments?.length || 0) > 0 ||
			(filters.doctors?.length || 0) > 0 ||
			(filters.timeSlots?.length || 0) > 0 ||
			(filters.patientTypes?.length || 0) > 0 ||
			(filters.processNodes?.length || 0) > 0 ||
			!filters.excludeAnomalies
		);
	}
</script>

<div class="card mb-6">
	<div class="flex items-center justify-between mb-4">
		<button
			class="flex items-center space-x-2 text-gray-700 font-medium"
			on:click={() => (expanded = !expanded)}
		>
			<Filter class="w-5 h-5 text-primary-500" />
			<span>筛选条件</span>
			{#if hasActiveFilters()}
				<span
					class="bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full font-medium"
				>
					{#each [
						filters.departments?.length || 0,
						filters.doctors?.length || 0,
						filters.timeSlots?.length || 0,
						filters.patientTypes?.length || 0
					] as c}
						{#if c > 0}{c}{/if}
					{/each}
					已选
				</span>
			{/if}
			<svelte:component this={expanded ? ChevronUp : ChevronDown} class="w-4 h-4" />
		</button>
		{#if hasActiveFilters()}
			<button
				class="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
				on:click={clearAll}
			>
				<X class="w-4 h-4" />
				<span>清除全部</span>
			</button>
		{/if}
	</div>

	{#if expanded}
		<div class="space-y-4">
			<div>
				<label class="text-sm font-medium text-gray-700 mb-2 block">科室</label>
				<div class="flex flex-wrap gap-2">
					{#each departments as dept}
						<button
							class="px-3 py-1.5 text-sm rounded-lg border transition-colors duration-150 {filters
								.departments?.includes(dept)
								? 'bg-primary-50 border-primary-300 text-primary-700'
								: 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}"
							on:click={() => toggleDepartment(dept)}
						>
							{dept}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<label class="text-sm font-medium text-gray-700 mb-2 block">时段</label>
				<div class="flex flex-wrap gap-2">
					{#each timeSlots as slot}
						<button
							class="px-3 py-1.5 text-sm rounded-lg border transition-colors duration-150 {filters
								.timeSlots?.includes(slot)
								? 'bg-primary-50 border-primary-300 text-primary-700'
								: 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}"
							on:click={() => toggleTimeSlot(slot)}
						>
							{slot}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<label class="text-sm font-medium text-gray-700 mb-2 block">患者类型</label>
				<div class="flex flex-wrap gap-2">
					{#each patientTypes as type}
						<button
							class="px-3 py-1.5 text-sm rounded-lg border transition-colors duration-150 {filters
								.patientTypes?.includes(type)
								? 'bg-primary-50 border-primary-300 text-primary-700'
								: 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}"
							on:click={() => togglePatientType(type)}
						>
							{type}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-gray-100">
				<label class="flex items-center space-x-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={filters.excludeAnomalies}
						on:change={toggleExcludeAnomalies}
						class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
					/>
					<span class="text-sm text-gray-600">排除异常数据</span>
				</label>
			</div>
		</div>
	{/if}
</div>
