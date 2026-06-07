<script lang="ts">
	type AnomalyItem = {
		id: string;
		metric: string;
		sku_id: string;
		sku_name: string;
		batch_no: string;
		description: string;
		severity: 'high' | 'medium' | 'low';
		detected_at: string;
		value: number;
		expected_range: { min: number; max: number };
	};

	let { data }: { data: AnomalyItem[] } = $props();

	type FilterKey = 'all' | 'high' | 'medium' | 'low';

	let activeFilter = $state<FilterKey>('all');
	let expandedIds = $state<Set<string>>(new Set());

	const severityBadge: Record<AnomalyItem['severity'], { class: string; label: string }> = {
		high: { class: 'bg-red-500/20 text-red-400', label: '高风险' },
		medium: { class: 'bg-orange-500/20 text-orange-400', label: '中风险' },
		low: { class: 'bg-blue-500/20 text-blue-400', label: '低风险' }
	};

	const filterTabs: { key: FilterKey; label: string }[] = [
		{ key: 'all', label: '全部' },
		{ key: 'high', label: '高风险' },
		{ key: 'medium', label: '中风险' },
		{ key: 'low', label: '低风险' }
	];

	let filteredData = $derived.by(() => {
		if (activeFilter === 'all') return data;
		return data.filter((d) => d.severity === activeFilter);
	});

	function toggleExpand(id: string) {
		const next = new Set(expandedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedIds = next;
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}
</script>

<div class="rounded-xl bg-[var(--color-primary)] shadow-sm overflow-hidden">
	<div class="flex items-center gap-1 px-4 pt-4 pb-2">
		{#each filterTabs as tab}
			<button
				class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors {activeFilter === tab.key
					? 'bg-white/15 text-white'
					: 'text-white/50 hover:text-white/80 hover:bg-white/5'}"
				onclick={() => (activeFilter = tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if filteredData.length === 0}
		<div class="flex flex-col items-center justify-center py-16 text-white/30">
			<svg class="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span class="text-base">暂无异常</span>
		</div>
	{:else}
		<div class="px-4 pb-4 flex flex-col gap-2">
			{#each filteredData as item}
				{@const badge = severityBadge[item.severity]}
				{@const isExpanded = expandedIds.has(item.id)}
				<div class="rounded-lg bg-white/5 border border-white/8 transition-colors hover:bg-white/8">
					<button
						class="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
						onclick={() => toggleExpand(item.id)}
					>
						<span class="shrink-0 inline-block px-2 py-0.5 rounded text-xs font-medium {badge.class}">
							{badge.label}
						</span>
						<span class="text-sm font-medium text-white truncate">{item.metric}</span>
						<span class="text-xs text-white/40 truncate">{item.sku_name}</span>
						<span class="ml-auto shrink-0 text-white/30">
							<svg class="w-4 h-4 transition-transform {isExpanded ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</span>
					</button>

					{#if isExpanded}
						<div class="px-4 pb-3 pt-0 border-t border-white/5">
							<div class="mt-3 mb-2">
								<div class="text-xs text-white/40 mb-1">异常描述</div>
								<div class="text-sm text-white/80">{item.description}</div>
							</div>

							<div class="grid grid-cols-3 gap-3 mt-3">
								<div class="bg-white/5 rounded-md px-3 py-2">
									<div class="text-xs text-white/40 mb-1">实际值</div>
									<div class="text-sm font-semibold text-[var(--color-accent)]">{item.value}</div>
								</div>
								<div class="bg-white/5 rounded-md px-3 py-2">
									<div class="text-xs text-white/40 mb-1">预期范围</div>
									<div class="text-sm font-semibold text-[var(--color-secondary)]">{item.expected_range.min} ~ {item.expected_range.max}</div>
								</div>
								<div class="bg-white/5 rounded-md px-3 py-2">
									<div class="text-xs text-white/40 mb-1">偏差幅度</div>
									{#if item.value > item.expected_range.max}
										{@const deviation = ((item.value - item.expected_range.max) / item.expected_range.max * 100).toFixed(1)}
										<div class="text-sm font-semibold text-red-400">+{deviation}%</div>
									{:else if item.value < item.expected_range.min}
										{@const deviation = ((item.expected_range.min - item.value) / item.expected_range.min * 100).toFixed(1)}
										<div class="text-sm font-semibold text-red-400">-{deviation}%</div>
									{:else}
										<div class="text-sm font-semibold text-[var(--color-secondary)]">正常</div>
									{/if}
								</div>
							</div>

							<div class="flex items-center gap-4 mt-3 text-xs text-white/30">
								<span>SKU: {item.sku_id}</span>
								<span>批次: {item.batch_no}</span>
								<span>检测时间: {formatDate(item.detected_at)}</span>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
