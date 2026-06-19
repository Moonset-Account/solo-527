<script lang="ts">
	let { data } = $props();

	let todos = $state<any[]>(data.todos);
	let statusFilter = $state('');
	let urgencyFilter = $state('');
	let panelOpen = $state(false);
	let selectedTodo: any = $state(null);
	let errorMessage = $state('');
	let submitLoading = $state(false);

	let formStatus = $state('in_progress');
	let formResult = $state('');
	let formEvidence = $state('');

	const statusTabs = [
		{ key: '', label: '全部' },
		{ key: 'pending', label: '待处理' },
		{ key: 'in_progress', label: '处理中' },
		{ key: 'completed', label: '已完成' }
	];

	const urgencyTabs = [
		{ key: '', label: '全部' },
		{ key: 'high', label: '紧急' },
		{ key: 'medium', label: '中等' },
		{ key: 'low', label: '一般' }
	];

	const filteredTodos = $derived(() => {
		let result = [...todos];
		if (statusFilter) {
			result = result.filter((t: any) => t.status === statusFilter);
		}
		if (urgencyFilter) {
			result = result.filter((t: any) => t.urgency === urgencyFilter);
		}
		result.sort((a: any, b: any) => {
			const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
			const ua = urgencyOrder[a.urgency] ?? 3;
			const ub = urgencyOrder[b.urgency] ?? 3;
			if (ua !== ub) return ua - ub;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
		return result;
	});

	function urgencyBadge(urgency: string): { label: string; cls: string } {
		switch (urgency) {
			case 'high': return { label: '紧急', cls: 'bg-danger/15 text-danger' };
			case 'medium': return { label: '中等', cls: 'bg-warning/15 text-warning' };
			case 'low': return { label: '一般', cls: 'bg-blue-500/15 text-blue-600' };
			default: return { label: urgency, cls: 'bg-gray-400/15 text-gray-500' };
		}
	}

	function statusBadge(status: string): { label: string; cls: string } {
		switch (status) {
			case 'pending': return { label: '待处理', cls: 'bg-warning/15 text-warning' };
			case 'in_progress': return { label: '处理中', cls: 'bg-blue-500/15 text-blue-600' };
			case 'completed': return { label: '已完成', cls: 'bg-success/15 text-success' };
			default: return { label: status, cls: 'bg-gray-400/15 text-gray-500' };
		}
	}

	function sourceLabel(source: string): string {
		switch (source) {
			case 'escalation': return '催办升级';
			case 'manual': return '手动创建';
			default: return source;
		}
	}

	function sourceBadgeClass(source: string): string {
		switch (source) {
			case 'escalation': return 'bg-accent/15 text-accent';
			case 'manual': return 'bg-purple-500/15 text-purple-600';
			default: return 'bg-gray-400/15 text-gray-500';
		}
	}

	function formatTime(ts: string): string {
		if (!ts) return '-';
		return new Date(ts).toLocaleString('zh-CN', {
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function relativeTime(ts: string): string {
		if (!ts) return '-';
		const now = Date.now();
		const then = new Date(ts).getTime();
		const diff = now - then;
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return '刚刚';
		if (minutes < 60) return `${minutes}分钟前`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}小时前`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}天前`;
		return formatTime(ts);
	}

	function openProcessPanel(todo: any) {
		selectedTodo = todo;
		formStatus = todo.status === 'completed' ? 'completed' : 'in_progress';
		formResult = todo.result || '';
		formEvidence = todo.evidence || '';
		errorMessage = '';
		panelOpen = true;
	}

	function closePanel() {
		panelOpen = false;
		selectedTodo = null;
	}

	async function submitProcess() {
		if (!selectedTodo) return;
		if (formStatus === 'completed' && !formEvidence.trim()) {
			errorMessage = '完成待办时处理依据为必填';
			return;
		}

		submitLoading = true;
		errorMessage = '';
		try {
			const res = await fetch(`/api/todos/${selectedTodo.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: formStatus,
					result: formResult.trim() || undefined,
					evidence: formEvidence.trim() || undefined,
					operatorId: 'admin',
					operatorName: '管理员'
				})
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '处理失败');
			}
			closePanel();
			await refreshData();
		} catch (e: any) {
			errorMessage = e.message || '处理失败';
		} finally {
			submitLoading = false;
		}
	}

	async function refreshData() {
		try {
			const res = await fetch('/api/todos');
			const d = await res.json();
			todos = d.todos || [];
		} catch (e) {
			console.error('刷新数据失败', e);
		}
	}
</script>

<svelte:head>
	<title>待办中心 - 导览协作</title>
</svelte:head>

<div class="flex flex-1 flex-col overflow-auto">
	<header class="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
		<h1 class="font-serif text-2xl font-bold text-text">待办中心</h1>
		<span class="text-sm text-text-muted">共 {filteredTodos().length} 条待办</span>
	</header>

	<main class="flex-1 p-8">
		<div class="mb-6 flex flex-wrap gap-3">
			<div class="flex rounded-lg bg-white border border-gray-100 overflow-hidden shadow-sm">
				{#each statusTabs as tab}
					<button
						type="button"
						onclick={() => { statusFilter = tab.key; }}
						class="px-4 py-2 text-sm font-medium transition-colors {statusFilter === tab.key
							? 'bg-primary text-white'
							: 'text-text-muted hover:text-text hover:bg-surface'}"
					>
						{tab.label}
					</button>
				{/each}
			</div>
			<div class="flex rounded-lg bg-white border border-gray-100 overflow-hidden shadow-sm">
				{#each urgencyTabs as tab}
					<button
						type="button"
						onclick={() => { urgencyFilter = tab.key; }}
						class="px-4 py-2 text-sm font-medium transition-colors {urgencyFilter === tab.key
							? 'bg-accent text-white'
							: 'text-text-muted hover:text-text hover:bg-surface'}"
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>

		{#if filteredTodos().length === 0}
			<div class="flex flex-col items-center justify-center py-24 text-text-muted">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-30"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
				<p class="text-lg font-serif">暂无匹配的待办</p>
				<p class="mt-1 text-sm">当前筛选条件下没有待办事项</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredTodos() as todo (todo.id)}
					{@const ub = urgencyBadge(todo.urgency)}
					{@const sb = statusBadge(todo.status)}
					<div class="rounded-xl bg-white shadow-sm border border-gray-100 p-5 transition-all duration-200 hover:shadow-md">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-2 flex-wrap">
									<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {ub.cls}">
										{ub.label}
									</span>
									<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {sb.cls}">
										{sb.label}
									</span>
									<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {sourceBadgeClass(todo.source)}">
										{sourceLabel(todo.source)}
									</span>
								</div>

								<p class="text-sm text-text leading-relaxed mb-2">{todo.description}</p>

								{#if todo.routeName || todo.itineraryId}
									<div class="flex items-center gap-3 text-xs text-text-muted mb-1">
										{#if todo.routeName}
											<span>路线: {todo.routeName}</span>
										{/if}
										{#if todo.itineraryId}
											<span>行程: {todo.itineraryId.slice(0, 8)}...</span>
										{/if}
									</div>
								{/if}

								{#if todo.status === 'completed'}
									<div class="mt-3 rounded-lg bg-success/5 border border-success/10 p-3 space-y-1">
										{#if todo.result}
											<div class="text-xs"><span class="font-medium text-text">处理结果:</span> <span class="text-text-muted">{todo.result}</span></div>
										{/if}
										{#if todo.evidence}
											<div class="text-xs"><span class="font-medium text-text">处理依据:</span> <span class="text-text-muted">{todo.evidence}</span></div>
										{/if}
										<div class="text-xs text-text-muted">
											处理人: {todo.operatorName || '-'} · 完成时间: {formatTime(todo.completedAt)}
										</div>
									</div>
								{:else}
									<div class="mt-2 text-xs text-text-muted">
										创建时间: {relativeTime(todo.createdAt)}
									</div>
								{/if}
							</div>

							{#if todo.status !== 'completed'}
								<button
									type="button"
									onclick={() => openProcessPanel(todo)}
									class="flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
								>
									处理
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

{#if panelOpen && selectedTodo}
	<div class="fixed inset-0 z-40 flex justify-end">
		<div class="absolute inset-0 bg-black/30" onclick={closePanel} role="presentation"></div>
		<div class="relative z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 class="font-serif text-lg font-semibold text-text">处理待办</h2>
				<button type="button" onclick={closePanel} class="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-6 space-y-5">
				<div class="rounded-lg bg-surface p-4 space-y-2">
					<div class="flex items-center gap-2 mb-1">
						<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {urgencyBadge(selectedTodo.urgency).cls}">
							{urgencyBadge(selectedTodo.urgency).label}
						</span>
						<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {sourceBadgeClass(selectedTodo.source)}">
							{sourceLabel(selectedTodo.source)}
						</span>
					</div>
					<p class="text-sm text-text">{selectedTodo.description}</p>
				</div>

				{#if errorMessage}
					<div class="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
						{errorMessage}
					</div>
				{/if}

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">状态</label>
					<select
						bind:value={formStatus}
						class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
					>
						<option value="in_progress">处理中</option>
						<option value="completed">已完成</option>
					</select>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">处理结果</label>
					<textarea
						bind:value={formResult}
						rows={3}
						class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
						placeholder="输入处理结果..."
					></textarea>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">处理依据 {#if formStatus === 'completed'}<span class="text-danger">*</span>{/if}</label>
					<textarea
						bind:value={formEvidence}
						rows={3}
						class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
						placeholder="输入处理依据..."
					></textarea>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">操作人</label>
					<div class="flex gap-3">
						<input
							type="text"
							value="admin"
							disabled
							class="flex-1 rounded-lg border border-gray-200 bg-surface px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
						/>
						<input
							type="text"
							value="管理员"
							disabled
							class="flex-1 rounded-lg border border-gray-200 bg-surface px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
						/>
					</div>
				</div>
			</div>

			<div class="border-t border-gray-200 px-6 py-4">
				<button
					type="button"
					onclick={submitProcess}
					disabled={submitLoading}
					class="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{submitLoading ? '提交中...' : '提交处理'}
				</button>
			</div>
		</div>
	</div>
{/if}
