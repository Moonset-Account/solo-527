<script lang="ts">
	type ReplenishmentItem = {
		sku_id: string;
		sku_name: string;
		warehouse_position: string;
		current_qty: number;
		safety_stock_qty: number;
		gap: number;
		priority: 'urgent' | 'high' | 'medium' | 'low';
		suggested_qty: number;
		lead_time_days: number;
	};

	let { data }: { data: ReplenishmentItem[] } = $props();

	let sortKey = $state<keyof ReplenishmentItem>('priority');
	let sortDir = $state<'asc' | 'desc'>('asc');

	const priorityOrder: Record<ReplenishmentItem['priority'], number> = {
		urgent: 0,
		high: 1,
		medium: 2,
		low: 3
	};

	const priorityLabel: Record<ReplenishmentItem['priority'], string> = {
		urgent: '紧急',
		high: '高',
		medium: '中',
		low: '低'
	};

	const priorityClass: Record<ReplenishmentItem['priority'], string> = {
		urgent: 'bg-red-100 text-red-700',
		high: 'bg-orange-100 text-orange-700',
		medium: 'bg-yellow-100 text-yellow-700',
		low: 'bg-green-100 text-green-700'
	};

	const columns: { key: keyof ReplenishmentItem; label: string }[] = [
		{ key: 'sku_id', label: 'SKU' },
		{ key: 'warehouse_position', label: '仓位' },
		{ key: 'current_qty', label: '当前库存' },
		{ key: 'safety_stock_qty', label: '安全库存' },
		{ key: 'gap', label: '缺口' },
		{ key: 'suggested_qty', label: '建议补货量' },
		{ key: 'lead_time_days', label: '提前期' },
		{ key: 'priority', label: '优先级' }
	];

	function handleSort(key: keyof ReplenishmentItem) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	let sortedData = $derived.by(() => {
		return [...data].sort((a, b) => {
			let valA: number | string = a[sortKey];
			let valB: number | string = b[sortKey];
			if (sortKey === 'priority') {
				valA = priorityOrder[a.priority];
				valB = priorityOrder[b.priority];
			}
			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}
			return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
		});
	});
</script>

<div class="rounded-xl bg-[var(--color-card)] shadow-sm border border-[var(--color-surface-dark)] overflow-hidden">
	<div class="overflow-x-auto max-h-[480px] overflow-y-auto">
		<table class="w-full text-sm">
			<thead class="sticky top-0 z-10 bg-[var(--color-primary)] text-white">
				<tr>
					{#each columns as col}
						<th
							class="px-4 py-3 text-left font-medium cursor-pointer select-none whitespace-nowrap hover:bg-[var(--color-primary-light)] transition-colors"
							onclick={() => handleSort(col.key)}
						>
							<span class="inline-flex items-center gap-1">
								{col.label}
								{#if sortKey === col.key}
									<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
										{#if sortDir === 'asc'}
											<path d="M6 2l4 5H2z" />
										{:else}
											<path d="M6 10l4-5H2z" />
										{/if}
									</svg>
								{/if}
							</span>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each sortedData as item, i}
					<tr class="border-b border-[var(--color-surface-dark)] hover:bg-[var(--color-surface)] transition-colors">
						<td class="px-4 py-3">
							<div>
								<div class="font-medium text-[var(--color-primary)]">{item.sku_id}</div>
								<div class="text-xs text-[var(--color-primary-light)]">{item.sku_name}</div>
							</div>
						</td>
						<td class="px-4 py-3 text-[var(--color-primary)]">{item.warehouse_position}</td>
						<td class="px-4 py-3 text-[var(--color-primary)]">{item.current_qty.toLocaleString()}</td>
						<td class="px-4 py-3 text-[var(--color-primary)]">{item.safety_stock_qty.toLocaleString()}</td>
						<td class="px-4 py-3">
							{#if item.gap < 0}
								<span class="inline-flex items-center gap-1 text-[var(--color-danger)] font-semibold">
									<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
										<path d="M6 10l4-5H2z" />
									</svg>
									{item.gap.toLocaleString()}
								</span>
							{:else}
								<span class="text-[var(--color-primary)]">{item.gap.toLocaleString()}</span>
							{/if}
						</td>
						<td class="px-4 py-3">
							<span class="font-bold text-[var(--color-accent)]">{item.suggested_qty.toLocaleString()}</span>
						</td>
						<td class="px-4 py-3 text-[var(--color-primary)]">{item.lead_time_days}天</td>
						<td class="px-4 py-3">
							<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium {priorityClass[item.priority]}">
								{priorityLabel[item.priority]}
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if data.length === 0}
		<div class="flex items-center justify-center py-12 text-[var(--color-primary-light)]">
			暂无补货建议
		</div>
	{/if}
</div>
