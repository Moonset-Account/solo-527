<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DimensionDataPoint } from '@/lib/types';
	import {
		formatNumber,
		formatPercent,
		isLowSample,
		isTransferRateHigh,
		isSatisfactionLow,
		getLevelLabel,
		getChannelLabel
	} from '@/lib/utils/format';
	import { StickyNote, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{
		drilldown: { dimension: string; value: string };
		addNote: { dimension: string; value: string };
	}>();

	export let data: DimensionDataPoint[] = [];
	export let sortField: keyof DimensionDataPoint = 'transfer_rate';
	export let sortOrder: 'asc' | 'desc' = 'desc';

	let displayData: DimensionDataPoint[] = [];

	$: {
		displayData = [...data].sort((a, b) => {
			const aVal = a[sortField];
			const bVal = b[sortField];
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
			}
			return 0;
		});
	}

	function handleSort(field: keyof DimensionDataPoint) {
		if (sortField === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortOrder = 'desc';
		}
	}

	function formatDimensionValue(item: DimensionDataPoint): string {
		switch (item.dimension) {
		case 'level':
			return getLevelLabel(item.dimension_value);
		case 'channel':
			return getChannelLabel(item.dimension_value);
		default:
			return item.dimension_value;
		}
	}

	function handleAddNoteClick(e: Event, item: DimensionDataPoint) {
		e.stopPropagation();
		dispatch('addNote', { dimension: item.dimension, value: item.dimension_value });
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full">
		<thead>
			<tr class="border-b border-slate-200">
				<th class="table-header cursor-pointer" onclick={() => handleSort('dimension_value')}>
					<div class="flex items-center gap-1">
						维度值
						{#if sortField === 'dimension_value'}
							{#if sortOrder === 'asc'}
								<ChevronUp class="w-4 h-4" />
							{:else}
								<ChevronDown class="w-4 h-4" />
							{/if}
						{:else}
							<ArrowUpDown class="w-4 h-4 text-slate-300" />
						{/if}
					</div>
				</th>
				<th class="table-header cursor-pointer text-right" onclick={() => handleSort('total_sessions')}>
					<div class="flex items-center justify-end gap-1">
						会话量
						{#if sortField === 'total_sessions'}
							{#if sortOrder === 'asc'}
								<ChevronUp class="w-4 h-4" />
							{:else}
								<ChevronDown class="w-4 h-4" />
							{/if}
						{:else}
							<ArrowUpDown class="w-4 h-4 text-slate-300" />
						{/if}
					</div>
				</th>
				<th class="table-header cursor-pointer text-right" onclick={() => handleSort('transfer_rate')}>
					<div class="flex items-center justify-end gap-1">
						转人工率
						{#if sortField === 'transfer_rate'}
							{#if sortOrder === 'asc'}
								<ChevronUp class="w-4 h-4" />
							{:else}
								<ChevronDown class="w-4 h-4" />
							{/if}
						{:else}
							<ArrowUpDown class="w-4 h-4 text-slate-300" />
						{/if}
					</div>
				</th>
				<th class="table-header cursor-pointer text-right" onclick={() => handleSort('avg_satisfaction')}>
					<div class="flex items-center justify-end gap-1">
						满意度
						{#if sortField === 'avg_satisfaction'}
							{#if sortOrder === 'asc'}
								<ChevronUp class="w-4 h-4" />
							{:else}
								<ChevronDown class="w-4 h-4" />
							{/if}
						{:else}
							<ArrowUpDown class="w-4 h-4 text-slate-300" />
						{/if}
					</div>
				</th>
				<th class="table-header text-right">平均轮次</th>
				<th class="table-header text-center">操作</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-100">
			{#each displayData as item, i}
				{@const highTransfer = isTransferRateHigh(item.transfer_rate)}
				{@const lowSatisfaction = isSatisfactionLow(item.avg_satisfaction)}
				{@const lowSample = isLowSample(item.total_sessions)}
				<tr
					class="hover:bg-slate-50 transition-colors cursor-pointer {highTransfer || lowSatisfaction
						? 'bg-red-50/30'
						: ''}"
					onclick={() => dispatch('drilldown', { dimension: item.dimension, value: item.dimension_value })}
				>
					<td class="table-cell">
						<div class="flex items-center gap-2">
							<span class="font-medium text-slate-900">{formatDimensionValue(item)}</span>
							{#if lowSample}
								<span
									class="text-xs text-amber-600 font-medium"
									title="样本量不足30，结论仅供参考"
								>
									*
								</span>
							{/if}
							{#if item.has_note}
								<StickyNote
									class="w-4 h-4 text-amber-500"
									onclick={(e) => handleAddNoteClick(e, item)}
								/>
							{/if}
						</div>
					</td>
					<td class="table-cell text-right font-mono">{formatNumber(item.total_sessions)}</td>
					<td class="table-cell text-right">
						<span
							class="font-mono font-medium {highTransfer
								? 'text-red-600'
								: 'text-slate-700'}"
						>
							{formatPercent(item.transfer_rate)}
						</span>
					</td>
					<td class="table-cell text-right">
						<span
							class="font-mono {lowSatisfaction
								? 'text-red-600 font-medium'
								: 'text-slate-700'}"
						>
							{item.avg_satisfaction.toFixed(2)}
						</span>
					</td>
					<td class="table-cell text-right font-mono text-slate-600">
						{item.avg_rounds.toFixed(1)}
					</td>
					<td class="table-cell text-center">
						<button
							class="text-primary-600 hover:text-primary-700 text-sm font-medium"
							onclick={(e) => handleAddNoteClick(e, item)}
						>
							添加备注
						</button>
					</td>
				</tr>
			{/each}
			{#if data.length === 0}
				<tr>
					<td colspan="6" class="table-cell text-center text-slate-400 py-8">暂无数据</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

{#if data.some((d) => isLowSample(d.total_sessions))}
	<div class="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
		<span class="font-medium">注意:</span>
		标记 * 的项样本量不足 30，排序结论仅供参考
	</div>
{/if}
