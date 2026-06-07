<script lang="ts">
	import { onMount } from 'svelte';
	import { filterStore } from '$lib/stores';
	import { queryDetailRecords, queryDetailCount } from '$lib/duckdb-service';
	import AnnotationModal from '$lib/components/AnnotationModal.svelte';
	import { MessageSquare, Camera, ChevronLeft, ChevronRight, Image } from 'lucide-svelte';

	let records: any[] = $state([]);
	let totalCount = $state(0);
	let page = $state(0);
	let pageSize = 30;
	let totalPages = $state(0);
	let annotationTaskId = $state('');
	let expandedRow = $state('');
	let statusFilter = $state('');
	let sortField = $state('planned_date');
	let sortDir = $state('desc');

	const statusLabels: Record<string, { text: string; class: string }> = {
		completed: { text: '已完成', class: 'bg-green-100 text-green-700' },
		overdue: { text: '人工逾期', class: 'bg-red-100 text-red-700' },
		rain_delayed: { text: '雨天延期', class: 'bg-blue-100 text-blue-700' },
		pending: { text: '待执行', class: 'bg-gray-100 text-gray-600' }
	};

	async function loadRecords() {
		try {
			let filter = { ...$filterStore };
			if (statusFilter) {
				filter = { ...filter, taskTypes: [...filter.taskTypes] };
			}
			const [data, count] = await Promise.all([
				queryDetailRecords(filter, page, pageSize),
				queryDetailCount(filter)
			]);
			records = data;
			totalCount = Number(count);
			totalPages = Math.ceil(totalCount / pageSize);
		} catch (e) {
			console.error(e);
		}
	}

	function goToPage(p: number) {
		if (p >= 0 && p < totalPages) {
			page = p;
		}
	}

	onMount(() => {
		loadRecords();
	});

	$effect(() => {
		const f = $filterStore;
		page = 0;
		loadRecords();
	});

	$effect(() => {
		loadRecords();
	});

	function toggleRow(id: string) {
		expandedRow = expandedRow === id ? '' : id;
	}

	function openAnnotation(taskId: string) {
		annotationTaskId = taskId;
	}

	function closeAnnotation() {
		annotationTaskId = '';
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-bold text-[#1B4332] font-serif">明细下钻</h1>
		<div class="flex items-center gap-3">
			<div class="flex gap-1">
				{#each ['', 'overdue', 'rain_delayed', 'completed'] as s}
					<button
						class="px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer {statusFilter === s ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						onclick={() => { statusFilter = s; page = 0; }}
					>
						{s === '' ? '全部' : statusLabels[s]?.text || s}
					</button>
				{/each}
			</div>
			<span class="text-xs text-gray-400">共 {totalCount} 条</span>
		</div>
	</div>

	<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-xs">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-100">
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">任务编号</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">片区</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">植物类型</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">任务类型</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">班组</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">计划日期</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">完成日期</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">状态</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">降雨量</th>
						<th class="px-3 py-2.5 text-left font-medium text-gray-600">备注</th>
					</tr>
				</thead>
				<tbody>
					{#each records as record, i}
						{@const sl = statusLabels[record.status] || { text: record.status, class: 'bg-gray-100 text-gray-500' }}
						<tr
							class="border-b border-gray-50 transition-colors {i % 2 === 0 ? '' : 'bg-gray-50/50'} hover:bg-[#1B4332]/5 cursor-pointer"
							onclick={() => toggleRow(record.id)}
						>
							<td class="px-3 py-2 font-mono text-gray-800">{record.id}</td>
							<td class="px-3 py-2 text-gray-700">{record.district}</td>
							<td class="px-3 py-2 text-gray-700">{record.plant_type}</td>
							<td class="px-3 py-2 text-gray-700">{record.task_type}</td>
							<td class="px-3 py-2 text-gray-700">{record.team}</td>
							<td class="px-3 py-2 text-gray-700">{String(record.planned_date).slice(0, 10)}</td>
							<td class="px-3 py-2 text-gray-700">{record.completed_date ? String(record.completed_date).slice(0, 10) : '-'}</td>
							<td class="px-3 py-2">
								<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium {sl.class}">
									{sl.text}
								</span>
							</td>
							<td class="px-3 py-2 text-gray-700">
								{Number(record.rainfall_mm).toFixed(1)}mm
								{#if Number(record.rainfall_mm) >= 10}
									<span class="text-[9px] text-[#219EBC] ml-0.5">🌧</span>
								{/if}
							</td>
							<td class="px-3 py-2">
								<button
									class="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
									onclick={(e) => { e.stopPropagation(); openAnnotation(record.id); }}
									title="添加备注"
								>
									<MessageSquare size={14} class="text-gray-400 hover:text-[#1B4332]" />
								</button>
							</td>
						</tr>
						{#if expandedRow === record.id}
							<tr class="bg-[#1B4332]/3 border-b border-gray-100">
								<td colspan="10" class="px-6 py-3">
									<div class="flex gap-6 text-xs">
										<div>
											<span class="font-medium text-gray-600">任务详情</span>
											<div class="mt-1 text-gray-500">
												病虫害问题: {record.pest_issue ? '是 ⚠️' : '无'}<br/>
												巡检照片: {record.photo_url ? '有' : '无'}
											</div>
										</div>
										{#if record.photo_url}
											<div>
												<span class="font-medium text-gray-600">巡检照片</span>
												<div class="mt-1 w-20 h-16 bg-gray-200 rounded flex items-center justify-center">
													<Image size={20} class="text-gray-400" />
												</div>
											</div>
										{/if}
										{#if record.status === 'rain_delayed'}
											<div class="bg-[#219EBC]/10 rounded-lg px-3 py-2">
												<div class="font-medium text-[#219EBC]">🌧 雨天自动延期</div>
												<div class="text-gray-500 mt-0.5">计划日降雨量 {Number(record.rainfall_mm).toFixed(1)}mm ≥ 10mm，系统自动延期</div>
											</div>
										{/if}
										{#if record.status === 'overdue'}
											<div class="bg-[#E76F51]/10 rounded-lg px-3 py-2">
												<div class="font-medium text-[#E76F51]">⚠️ 人工逾期</div>
												<div class="text-gray-500 mt-0.5">非雨天原因导致的任务逾期，需人工干预</div>
											</div>
										{/if}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>

		<div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
			<div class="text-xs text-gray-500">
				第 {page + 1} / {totalPages || 1} 页
			</div>
			<div class="flex gap-1">
				<button
					onclick={() => goToPage(page - 1)}
					disabled={page <= 0}
					class="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
				>
					<ChevronLeft size={16} />
				</button>
				{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
					const start = Math.max(0, Math.min(page - 2, totalPages - 5));
					return start + i;
				}) as p}
					{#if p < totalPages}
						<button
							onclick={() => goToPage(p)}
							class="w-7 h-7 rounded text-[10px] transition-colors cursor-pointer {page === p ? 'bg-[#1B4332] text-white' : 'bg-white text-gray-600 hover:bg-gray-200'}"
						>
							{p + 1}
						</button>
					{/if}
				{/each}
				<button
					onclick={() => goToPage(page + 1)}
					disabled={page >= totalPages - 1}
					class="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
				>
					<ChevronRight size={16} />
				</button>
			</div>
		</div>
	</div>
</div>

<AnnotationModal taskId={annotationTaskId} onClose={closeAnnotation} />
