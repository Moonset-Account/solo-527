<script lang="ts">
	type HistoryItem = {
		id: string;
		operatorName: string;
		action: string;
		targetType: string;
		targetId: string | null;
		detail: string | null;
		metadata: Record<string, unknown> | null;
		createdAt: string;
	};

	type Pagination = {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};

	let items = $state<HistoryItem[]>([]);
	let pagination = $state<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
	let loading = $state(true);
	let loadingMore = $state(false);

	let targetTypeFilter = $state('');
	let searchQuery = $state('');
	let startDate = $state('');
	let endDate = $state('');

	let showScrollTop = $state(false);

	const targetTypeOptions = [
		{ value: '', label: '全部' },
		{ value: 'customer', label: '客户' },
		{ value: 'appointment', label: '预约' },
		{ value: 'cashier', label: '收银' },
		{ value: 'treatment_card', label: '疗程卡' },
		{ value: 'work', label: '作品' },
		{ value: 'comment', label: '评论' },
		{ value: 'reminder', label: '提醒' }
	];

	const actionStyles: Record<string, { label: string; bg: string; dot: string }> = {
		创建: { label: '创建', bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
		更新: { label: '更新', bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
		删除: { label: '删除', bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
		审核通过: { label: '审核通过', bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
		审核拒绝: { label: '审核拒绝', bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
	};

	const targetTypeLabels: Record<string, string> = {
		customer: '客户',
		appointment: '预约',
		cashier: '收银',
		treatment_card: '疗程卡',
		work: '作品',
		comment: '评论',
		reminder: '提醒'
	};

	let groupedItems = $derived.by(() => {
		const groups: { date: string; label: string; entries: (HistoryItem & { time: string })[] }[] = [];
		const dateMap = new Map<string, (HistoryItem & { time: string })[]>();

		let filtered = items;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.operatorName.toLowerCase().includes(q) ||
					(item.detail ?? '').toLowerCase().includes(q) ||
					(item.targetType ?? '').toLowerCase().includes(q)
			);
		}
		if (startDate) {
			filtered = filtered.filter((item) => item.createdAt >= startDate);
		}
		if (endDate) {
			filtered = filtered.filter((item) => item.createdAt <= endDate + 'T23:59:59');
		}

		for (const item of filtered) {
			const date = item.createdAt.split('T')[0];
			const time = new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
			const entry = { ...item, time };

			if (!dateMap.has(date)) {
				dateMap.set(date, []);
			}
			dateMap.get(date)!.push(entry);
		}

		for (const [date, entries] of dateMap) {
			const label = new Date(date).toLocaleDateString('zh-CN', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				weekday: 'short'
			});
			groups.push({ date, label, entries });
		}

		return groups;
	});

	let hasMore = $derived(pagination.page < pagination.totalPages);

	async function loadHistory(append = false) {
		if (append) {
			loadingMore = true;
		} else {
			loading = true;
		}
		try {
			const params = new URLSearchParams();
			params.set('page', String(pagination.page));
			params.set('limit', '20');
			if (targetTypeFilter) params.set('target_type', targetTypeFilter);
			const res = await fetch(`/api/history?${params}`);
			const data = await res.json();
			if (append) {
				items = [...items, ...data.data];
			} else {
				items = data.data;
			}
			pagination = data.pagination;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function loadMore() {
		pagination.page++;
		await loadHistory(true);
	}

	async function applyFilter() {
		pagination.page = 1;
		await loadHistory(false);
	}

	function getActionStyle(action: string) {
		return actionStyles[action] ?? { label: action, bg: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
	}

	function isToday(date: string) {
		return date === new Date().toISOString().split('T')[0];
	}

	function scrollToTop() {
		document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		loadHistory();
	});
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold text-gray-800">操作历史</h2>
		<p class="mt-1 text-sm text-gray-500">查看系统操作记录时间线</p>
	</div>

	<div class="rounded-xl bg-white shadow-sm p-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
			<div class="flex-1 min-w-0">
				<label for="filter-target-type" class="mb-1 block text-xs font-medium text-gray-500">目标类型</label>
				<select
					id="filter-target-type"
					bind:value={targetTypeFilter}
					onchange={applyFilter}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
				>
					{#each targetTypeOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<div class="flex-1 min-w-0">
				<label for="filter-start-date" class="mb-1 block text-xs font-medium text-gray-500">开始日期</label>
				<input
					id="filter-start-date"
					type="date"
					bind:value={startDate}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
				/>
			</div>
			<div class="flex-1 min-w-0">
				<label for="filter-end-date" class="mb-1 block text-xs font-medium text-gray-500">结束日期</label>
				<input
					id="filter-end-date"
					type="date"
					bind:value={endDate}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
				/>
			</div>
			<div class="flex-1 min-w-0">
				<label for="filter-search" class="mb-1 block text-xs font-medium text-gray-500">搜索</label>
				<input
					id="filter-search"
					type="text"
					bind:value={searchQuery}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
					placeholder="搜索操作人/内容..."
				/>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
		</div>
	{:else if groupedItems.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-gray-400">
			<svg class="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p>暂无操作历史记录</p>
		</div>
	{:else}
		<div class="relative">
			<div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 md:left-1/2 md:-translate-x-0.5"></div>

			{#each groupedItems as group, groupIdx}
				<div class="mb-8">
					<div class="relative mb-4 flex items-center justify-center md:justify-center">
						<div class="relative z-10 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
							{isToday(group.date) ? '今天 · ' : ''}{group.label}
						</div>
					</div>

					{#each group.entries as entry, entryIdx}
						{@const actionStyle = getActionStyle(entry.action)}
						{@const isLeft = entryIdx % 2 === 0}
						<div class="relative mb-6 md:flex {isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}">
							<div class="absolute left-4 md:left-1/2 top-2 z-10 flex -translate-x-1/2 items-center justify-center">
								<div class="h-3 w-3 rounded-full {actionStyle.dot} ring-4 ring-white"></div>
							</div>

							<div class="ml-10 md:ml-0 md:w-1/2 {isLeft ? 'md:pr-10' : 'md:pl-10'}">
								<div class="rounded-xl bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<span class="text-xs font-mono text-gray-400">{entry.time}</span>
											<span class="rounded-full px-2 py-0.5 text-xs font-medium {actionStyle.bg}">
												{actionStyle.label}
											</span>
										</div>
										<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
											{targetTypeLabels[entry.targetType] ?? entry.targetType}
										</span>
									</div>

									<div class="mb-2">
										<span class="text-sm font-medium text-gray-800">{entry.operatorName}</span>
										<span class="text-sm text-gray-400 mx-1">·</span>
										<span class="text-sm text-gray-500">{actionStyle.label}了{targetTypeLabels[entry.targetType] ?? entry.targetType}</span>
									</div>

									{#if entry.detail}
										<p class="text-sm text-gray-600 mb-2">{entry.detail}</p>
									{/if}

									{#if entry.metadata && typeof entry.metadata === 'object'}
										<div class="rounded-lg bg-gray-50 p-2 space-y-1">
											{#each Object.entries(entry.metadata) as [key, value]}
												<div class="flex items-center gap-2 text-xs">
													<span class="text-gray-400">{key}:</span>
													<span class="text-gray-600">{String(value)}</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>

		{#if hasMore}
			<div class="flex justify-center py-6">
				<button
					onclick={loadMore}
					disabled={loadingMore}
					class="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
				>
					{loadingMore ? '加载中...' : '加载更多'}
				</button>
			</div>
		{/if}
	{/if}
</div>

{#if showScrollTop}
	<button
		onclick={scrollToTop}
		aria-label="回到顶部"
		class="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-colors"
	>
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
		</svg>
	</button>
{/if}
