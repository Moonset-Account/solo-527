<script lang="ts">
	type NearExpiryItem = {
		sku_id: string;
		sku_name: string;
		batch_no: string;
		warehouse_position: string;
		expiry_date: string;
		days_to_expiry: number;
		current_quantity: number;
		total_quantity: number;
		ratio: number;
	};

	let { data }: { data: NearExpiryItem[] } = $props();

	function getAlertLevel(days: number): 'critical' | 'warning' | 'caution' {
		if (days <= 7) return 'critical';
		if (days <= 15) return 'warning';
		return 'caution';
	}

	const levelStyle: Record<string, { border: string; bg: string; countdown: string; label: string }> = {
		critical: {
			border: 'border-l-red-500',
			bg: 'bg-red-50',
			countdown: 'text-red-600',
			label: '即将过期'
		},
		warning: {
			border: 'border-l-orange-500',
			bg: 'bg-orange-50',
			countdown: 'text-orange-600',
			label: '临近过期'
		},
		caution: {
			border: 'border-l-yellow-500',
			bg: 'bg-yellow-50',
			countdown: 'text-yellow-600',
			label: '注意临期'
		}
	};

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
</script>

{#if data.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-[var(--color-primary-light)]">
		<svg class="w-12 h-12 mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<span class="text-base">暂无临期预警</span>
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data as item}
			{@const level = getAlertLevel(item.days_to_expiry)}
			{@const style = levelStyle[level]}
			<div class="rounded-lg border border-[var(--color-surface-dark)] border-l-4 {style.border} {style.bg} p-4 shadow-sm transition-shadow hover:shadow-md">
				<div class="flex items-start justify-between mb-3">
					<div class="min-w-0 flex-1">
						<div class="font-semibold text-[var(--color-primary)] truncate">{item.sku_name}</div>
						<div class="text-xs text-[var(--color-primary-light)] mt-0.5">批次: {item.batch_no}</div>
					</div>
					<span class="shrink-0 ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium {style.countdown} bg-white/60">
						{style.label}
					</span>
				</div>

				<div class="flex items-end justify-between mb-3">
					<div>
						<div class="text-xs text-[var(--color-primary-light)] mb-1">剩余天数</div>
						<div class="text-3xl font-bold leading-none {style.countdown}">
							{item.days_to_expiry}
							<span class="text-sm font-medium ml-0.5">天</span>
						</div>
					</div>
					<div class="text-right">
						<div class="text-xs text-[var(--color-primary-light)]">到期日</div>
						<div class="text-sm font-medium text-[var(--color-primary)]">{formatDate(item.expiry_date)}</div>
					</div>
				</div>

				<div class="flex items-center justify-between pt-3 border-t border-[var(--color-surface-dark)]">
					<div>
						<span class="text-xs text-[var(--color-primary-light)]">当前数量</span>
						<span class="ml-1 text-sm font-medium text-[var(--color-primary)]">{item.current_quantity}</span>
					</div>
					<div>
						<span class="text-xs text-[var(--color-primary-light)]">仓位</span>
						<span class="ml-1 text-sm font-medium text-[var(--color-primary)]">{item.warehouse_position}</span>
					</div>
					<div>
						<span class="text-xs text-[var(--color-primary-light)]">占比</span>
						<span class="ml-1 text-sm font-medium text-[var(--color-accent)]">{(item.ratio * 100).toFixed(1)}%</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
