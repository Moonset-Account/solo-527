<script lang="ts">
	type CommentItem = {
		comment: {
			id: string;
			workId: string;
			customerId: string | null;
			authorName: string | null;
			content: string;
			rating: number | null;
			status: string;
			createdAt: string;
			reviewedAt: string | null;
		};
		work: { id: string; title: string } | null;
		customer: { id: string; name: string } | null;
	};

	let comments = $state<CommentItem[]>([]);
	let loading = $state(true);

	let statusFilter = $state('pending');
	let workFilter = $state('');
	let searchQuery = $state('');

	const statusTabs = [
		{ key: '', label: '全部' },
		{ key: 'pending', label: '待审核' },
		{ key: 'approved', label: '已通过' },
		{ key: 'rejected', label: '已拒绝' }
	];

	const statusStyles: Record<string, { label: string; cls: string }> = {
		pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
		approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
		rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' }
	};

	let uniqueWorks = $derived(() => {
		const map = new Map<string, string>();
		for (const c of comments) {
			if (c.work?.id && c.work.title) {
				map.set(c.work.id, c.work.title);
			}
		}
		return Array.from(map.entries());
	});

	let filteredComments = $derived(
		comments.filter((item) => {
			if (statusFilter && item.comment.status !== statusFilter) return false;
			if (workFilter && item.comment.workId !== workFilter) return false;
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				const content = item.comment.content.toLowerCase();
				const author = (item.comment.authorName ?? item.customer?.name ?? '').toLowerCase();
				if (!content.includes(q) && !author.includes(q)) return false;
			}
			return true;
		})
	);

	let stats = $derived({
		total: comments.length,
		pending: comments.filter((c) => c.comment.status === 'pending').length,
		approved: comments.filter((c) => c.comment.status === 'approved').length,
		rejected: comments.filter((c) => c.comment.status === 'rejected').length,
		avgRating: (() => {
			const rated = comments.filter((c) => c.comment.rating !== null && c.comment.status === 'approved');
			if (rated.length === 0) return 0;
			const sum = rated.reduce((acc, c) => acc + Number(c.comment.rating ?? 0), 0);
			return (sum / rated.length).toFixed(1);
		})()
	});

	async function loadData() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			const res = await fetch(`/api/comments?${params}`);
			comments = await res.json();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function approve(item: CommentItem) {
		try {
			await fetch('/api/comments', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: item.comment.id, status: 'approved' })
			});
			await loadData();
		} catch (e) {
			console.error(e);
		}
	}

	async function reject(item: CommentItem) {
		try {
			await fetch('/api/comments', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: item.comment.id, status: 'rejected' })
			});
			await loadData();
		} catch (e) {
			console.error(e);
		}
	}

	async function batchApprove() {
		const pending = comments.filter((c) => c.comment.status === 'pending');
		for (const item of pending) {
			await fetch('/api/comments', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: item.comment.id, status: 'approved' })
			});
		}
		await loadData();
	}

	function renderStars(rating: number | null): string {
		if (!rating) return '';
		return '★'.repeat(rating) + '☆'.repeat(5 - rating);
	}

	function formatDate(d: string | null) {
		if (!d) return '-';
		return new Date(d).toLocaleString('zh-CN');
	}

	$effect(() => {
		loadData();
	});

	$effect(() => {
		if (statusFilter) loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">评论审核</h2>
			<p class="mt-1 text-sm text-gray-500">审核客户提交的作品评论</p>
		</div>
		{#if stats.pending > 0}
			<button
				onclick={batchApprove}
				class="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-600 transition-colors"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
				一键通过全部 ({stats.pending})
			</button>
		{/if}
	</div>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">评论总数</p>
			<p class="mt-1 text-2xl font-bold text-gray-800">{stats.total}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">待审核</p>
			<p class="mt-1 text-2xl font-bold text-yellow-500">{stats.pending}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">已通过</p>
			<p class="mt-1 text-2xl font-bold text-green-500">{stats.approved}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">平均评分</p>
			<p class="mt-1 text-2xl font-bold text-amber-500">{stats.avgRating} <span class="text-sm font-normal">★</span></p>
		</div>
	</div>

	<div class="rounded-xl bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="flex flex-wrap gap-1">
				{#each statusTabs as tab}
					<button
						onclick={() => (statusFilter = tab.key)}
						class="relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors {statusFilter === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
					>
						{tab.label}
						{#if tab.key === 'pending' && stats.pending > 0}
							<span class="ml-1 inline-flex items-center justify-center rounded-full bg-white/30 px-1.5 py-0.5 text-[10px] font-bold">{stats.pending}</span>
						{/if}
					</button>
				{/each}
			</div>
			<div class="flex-1" />
			<select
				bind:value={workFilter}
				class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
			>
				<option value="">全部作品</option>
				{#each uniqueWorks() as [id, title]}
					<option value={id}>{title.length > 20 ? title.slice(0, 20) + '...' : title}</option>
				{/each}
			</select>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索内容/评论人..."
				class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-48"
			/>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
		</div>
	{:else if filteredComments.length === 0}
		<div class="rounded-xl bg-white p-16 text-center shadow-sm">
			<span class="text-6xl mb-4 block">💬</span>
			<p class="text-gray-400">暂无评论数据</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredComments as item (item.comment.id)}
				{@const ss = statusStyles[item.comment.status] ?? statusStyles.pending}
				<div
					class="rounded-xl bg-white shadow-sm overflow-hidden {item.comment.status === 'pending' ? 'ring-2 ring-yellow-200/50' : ''}"
				>
					<div class="p-5">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex flex-wrap items-center gap-2 mb-3">
									<div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
										{(item.comment.authorName ?? item.customer?.name ?? '?')[0]}
									</div>
									<div class="min-w-0">
										<p class="font-semibold text-gray-800 truncate">
											{item.comment.authorName ?? item.customer?.name ?? '匿名用户'}
										</p>
										<p class="text-xs text-gray-400">
											{formatDate(item.comment.createdAt)}
											{#if item.comment.reviewedAt}
												<span class="ml-2">· 审核于 {formatDate(item.comment.reviewedAt)}</span>
											{/if}
										</p>
									</div>
									<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {ss.cls}">
										{ss.label}
									</span>
									{#if item.comment.rating}
										<span class="text-amber-400 text-sm">{renderStars(item.comment.rating)}</span>
									{/if}
								</div>
								<p class="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">{item.comment.content}</p>
								{#if item.work}
									<div class="inline-flex items-center gap-2 rounded-lg bg-pink-50 px-3 py-1.5">
										<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
										<span class="text-sm text-primary font-medium">作品：{item.work.title}</span>
									</div>
								{/if}
							</div>
							{#if item.comment.status === 'pending'}
								<div class="flex sm:flex-col gap-2 shrink-0 sm:min-w-[100px]">
									<button
										onclick={() => approve(item)}
										class="flex-1 rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
									>
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
										通过
									</button>
									<button
										onclick={() => reject(item)}
										class="flex-1 rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
									>
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
										拒绝
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
