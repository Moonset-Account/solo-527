<script lang="ts">
	let {
		skuOptions = [],
		warehouseOptions = [],
		supplierOptions = [],
		batchOptions = [],
		ageBucketOptions = ['0-30', '30-60', '60-90', '90-180', '180+'],
		onFilterChange
	}: {
		skuOptions: string[]
		warehouseOptions: string[]
		supplierOptions: string[]
		batchOptions: string[]
		ageBucketOptions: string[]
		onFilterChange: (filter: {
			sku_ids: string[]
			warehouse_positions: string[]
			supplier_ids: string[]
			batch_nos: string[]
			age_buckets: string[]
			date_range: { start: string; end: string }
		}) => void
	} = $props()

	let selectedSku = $state<string[]>([])
	let selectedWarehouse = $state<string[]>([])
	let selectedSupplier = $state<string[]>([])
	let selectedBatch = $state<string[]>([])
	let selectedAgeBucket = $state<string[]>([])
	let dateStart = $state('')
	let dateEnd = $state('')
	let openDropdown = $state<string | null>(null)

	function toggleDropdown(key: string) {
		openDropdown = openDropdown === key ? null : key
	}

	function closeDropdown() {
		openDropdown = null
	}

	function toggleItem(arr: string[], item: string): string[] {
		return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]
	}

	function toggleSelection(key: string, item: string) {
		if (key === 'sku') selectedSku = toggleItem(selectedSku, item)
		else if (key === 'warehouse') selectedWarehouse = toggleItem(selectedWarehouse, item)
		else if (key === 'supplier') selectedSupplier = toggleItem(selectedSupplier, item)
		else if (key === 'batch') selectedBatch = toggleItem(selectedBatch, item)
		else if (key === 'ageBucket') selectedAgeBucket = toggleItem(selectedAgeBucket, item)
	}

	function resetAll() {
		selectedSku = []
		selectedWarehouse = []
		selectedSupplier = []
		selectedBatch = []
		selectedAgeBucket = []
		dateStart = ''
		dateEnd = ''
		openDropdown = null
	}

	function applyFilter() {
		onFilterChange({
			sku_ids: selectedSku,
			warehouse_positions: selectedWarehouse,
			supplier_ids: selectedSupplier,
			batch_nos: selectedBatch,
			age_buckets: selectedAgeBucket,
			date_range: { start: dateStart, end: dateEnd }
		})
		closeDropdown()
	}

	const filterGroups = $derived([
		{ key: 'sku', label: 'SKU', options: skuOptions, selected: selectedSku },
		{ key: 'warehouse', label: '仓位', options: warehouseOptions, selected: selectedWarehouse },
		{ key: 'supplier', label: '供应商', options: supplierOptions, selected: selectedSupplier },
		{ key: 'batch', label: '批次', options: batchOptions, selected: selectedBatch },
		{ key: 'ageBucket', label: '库龄区间', options: ageBucketOptions, selected: selectedAgeBucket }
	])

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement
		if (!target.closest('.filter-dropdown-wrapper')) {
			closeDropdown()
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="flex flex-wrap items-end gap-4">
	{#each filterGroups as group}
		<div class="filter-dropdown-wrapper relative">
			<label class="block text-xs font-medium mb-1.5" style="color: var(--color-primary-light); font-family: var(--font-body);">
				{group.label}
			</label>
			<button
				type="button"
				class="filter-trigger"
				class:active={openDropdown === group.key}
				onclick={(e: MouseEvent) => { e.stopPropagation(); toggleDropdown(group.key) }}
			>
				<span class="truncate">{group.label}</span>
				{#if group.selected.length > 0}
					<span class="badge">{group.selected.length}</span>
				{/if}
				<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>

			{#if openDropdown === group.key}
				<div class="dropdown-panel" onclick={(e: MouseEvent) => e.stopPropagation()}>
					{#if group.options.length === 0}
						<div class="px-3 py-2 text-xs" style="color: var(--color-primary-light);">暂无选项</div>
					{:else}
						{#each group.options as option}
							<label class="dropdown-option">
								<input
									type="checkbox"
									checked={group.selected.includes(option)}
									onchange={() => toggleSelection(group.key, option)}
								/>
								<span class="truncate">{option}</span>
							</label>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{/each}

	<div class="relative">
		<label class="block text-xs font-medium mb-1.5" style="color: var(--color-primary-light); font-family: var(--font-body);">
			日期范围
		</label>
		<div class="flex items-center gap-2">
			<input
				type="date"
				bind:value={dateStart}
				class="date-input"
			/>
			<span class="text-xs" style="color: var(--color-primary-light);">至</span>
			<input
				type="date"
				bind:value={dateEnd}
				class="date-input"
			/>
		</div>
	</div>

	<div class="flex items-end gap-2 ml-auto">
		<button type="button" class="btn btn-reset" onclick={resetAll}>
			重置
		</button>
		<button type="button" class="btn btn-apply" onclick={applyFilter}>
			应用
		</button>
	</div>
</div>

<style>
	.filter-trigger {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 12px;
		min-width: 130px;
		height: 36px;
		border-radius: 8px;
		border: 1px solid var(--color-surface-dark);
		background-color: var(--color-card);
		color: var(--color-primary);
		font-size: 13px;
		font-family: var(--font-body);
		cursor: pointer;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.filter-trigger:hover {
		border-color: var(--color-accent);
	}

	.filter-trigger.active {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.15);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background-color: var(--color-accent);
		color: #ffffff;
		font-size: 11px;
		font-weight: 600;
		line-height: 1;
	}

	.chevron {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		margin-left: auto;
		color: var(--color-primary-light);
		transition: transform 0.15s ease;
	}

	.filter-trigger.active .chevron {
		transform: rotate(180deg);
	}

	.dropdown-panel {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		z-index: 50;
		min-width: 180px;
		max-height: 240px;
		overflow-y: auto;
		background-color: var(--color-card);
		border: 1px solid var(--color-surface-dark);
		border-radius: 10px;
		box-shadow: 0 8px 24px rgba(27, 42, 74, 0.12), 0 2px 8px rgba(27, 42, 74, 0.08);
		padding: 4px;
	}

	.dropdown-option {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		border-radius: 6px;
		font-size: 13px;
		color: var(--color-primary);
		cursor: pointer;
		transition: background-color 0.1s ease;
		font-family: var(--font-body);
	}

	.dropdown-option:hover {
		background-color: var(--color-surface);
	}

	.dropdown-option input[type='checkbox'] {
		width: 15px;
		height: 15px;
		accent-color: var(--color-accent);
		flex-shrink: 0;
		cursor: pointer;
	}

	.date-input {
		height: 36px;
		padding: 0 10px;
		border-radius: 8px;
		border: 1px solid var(--color-surface-dark);
		background-color: var(--color-card);
		color: var(--color-primary);
		font-size: 13px;
		font-family: var(--font-body);
		outline: none;
		cursor: pointer;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.date-input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.15);
	}

	.btn {
		height: 36px;
		padding: 0 20px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		font-family: var(--font-body);
		cursor: pointer;
		transition: all 0.15s ease;
		border: none;
	}

	.btn-reset {
		background-color: var(--color-surface);
		color: var(--color-primary-light);
		border: 1px solid var(--color-surface-dark);
	}

	.btn-reset:hover {
		background-color: var(--color-surface-dark);
		color: var(--color-primary);
	}

	.btn-apply {
		background-color: var(--color-accent);
		color: #ffffff;
	}

	.btn-apply:hover {
		background-color: var(--color-accent-light);
	}
</style>
