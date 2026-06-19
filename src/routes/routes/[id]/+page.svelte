<script lang="ts">
	let { data } = $props();

	let selectedVersionIndex = $state(0);
	let showEditPanel = $state(false);
	let showRollbackModal = $state(false);
	let submitError = $state('');
	let submitting = $state(false);

	let editForm = $state({
		departureTime: '',
		guide: '',
		content: '{}',
		changeReason: '',
		operatorId: 'admin',
		operatorName: '管理员'
	});

	let rollbackReason = $state('');
	let rollbackVersion = $state(0);

	const route = $derived(data.route);
	const inventory = $derived(data.inventory);
	const itineraries = $derived(data.itineraries);

	const selectedItinerary = $derived(
		itineraries[selectedVersionIndex] || null
	);

	const currentOperator = { id: 'admin', name: '管理员' };

	function getStatusConfig(status: string) {
		switch (status) {
			case 'active':
				return { label: '进行中', cls: 'bg-success/15 text-success' };
			case 'upcoming':
				return { label: '即将开始', cls: 'bg-blue-500/15 text-blue-600' };
			case 'ended':
				return { label: '已结束', cls: 'bg-gray-400/15 text-gray-500' };
			default:
				return { label: status, cls: 'bg-gray-400/15 text-gray-500' };
		}
	}

	function formatTime(ts: string | null | undefined): string {
		if (!ts) return '-';
		return new Date(ts).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatContent(content: any): string {
		if (!content) return '{}';
		if (typeof content === 'string') return content;
		return JSON.stringify(content, null, 2);
	}

	function openEditPanel() {
		editForm.departureTime = new Date().toISOString().slice(0, 16);
		editForm.guide = '';
		editForm.content = '{}';
		editForm.changeReason = '';
		editForm.operatorId = currentOperator.id;
		editForm.operatorName = currentOperator.name;
		submitError = '';
		showEditPanel = true;
	}

	function closeEditPanel() {
		showEditPanel = false;
		submitError = '';
	}

	async function submitItinerary() {
		submitting = true;
		submitError = '';
		try {
			let parsedContent = editForm.content;
			try {
				parsedContent = JSON.parse(editForm.content);
			} catch {
				submitError = '行程内容必须是有效的 JSON 格式';
				submitting = false;
				return;
			}

			const res = await fetch(`/api/routes/${route.id}/itineraries`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					departureTime: new Date(editForm.departureTime).toISOString(),
					guide: editForm.guide,
					content: parsedContent,
					changeReason: editForm.changeReason,
					operatorId: editForm.operatorId,
					operatorName: editForm.operatorName
				})
			});
			if (!res.ok) {
				const err = await res.json();
				submitError = err.error || '创建失败';
				return;
			}
			closeEditPanel();
			window.location.reload();
		} catch (e: any) {
			submitError = e.message || '网络错误';
		} finally {
			submitting = false;
		}
	}

	function openRollbackModal() {
		if (itineraries.length <= 1) return;
		rollbackVersion = itineraries[itineraries.length - 1]?.version ?? 0;
		rollbackReason = '';
		showRollbackModal = true;
	}

	function closeRollbackModal() {
		showRollbackModal = false;
	}

	async function submitRollback() {
		submitting = true;
		submitError = '';
		try {
			const targetItin = itineraries.find(
				(i: any) => i.version === rollbackVersion
			);
			if (!targetItin) {
				submitError = '未找到目标版本';
				return;
			}

			const res = await fetch(`/api/routes/${route.id}/itineraries`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					departureTime: targetItin.departureTime,
					guide: targetItin.guide,
					content: targetItin.content,
					changeReason: `回滚至版本 ${rollbackVersion}：${rollbackReason}`,
					operatorId: currentOperator.id,
					operatorName: currentOperator.name
				})
			});
			if (!res.ok) {
				const err = await res.json();
				submitError = err.error || '回滚失败';
				return;
			}
			closeRollbackModal();
			window.location.reload();
		} catch (e: any) {
			submitError = e.message || '网络错误';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{route?.name || '路线详情'} - 导览协作</title>
</svelte:head>

{#if route}
	{@const statusCfg = getStatusConfig(route.status)}
	<div class="flex flex-1 flex-col overflow-auto">
		<header class="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
			<div class="flex items-center gap-4">
				<a href="/routes" class="text-text-muted hover:text-primary transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
				</a>
				<h1 class="font-serif text-2xl font-bold text-text">{route.name}</h1>
				<span class="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">{route.city}</span>
				<span class="rounded-full {statusCfg.cls} px-2.5 py-0.5 text-xs font-medium">{statusCfg.label}</span>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={openEditPanel}
					class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
					编辑行程
				</button>
				<button
					onclick={openRollbackModal}
					class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-gray-50"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
					回滚版本
				</button>
			</div>
		</header>

		<div class="flex items-center gap-6 bg-white border-b border-gray-200 px-8 py-3">
			{#if inventory}
				<span class="text-sm text-text-muted">
					库存：<span class="font-medium text-text">{inventory.available}</span> / {inventory.total} 可用
				</span>
			{/if}
			<span class="text-sm text-text-muted">
				版本数：<span class="font-medium text-text">{itineraries.length}</span>
			</span>
			{#if route.meetingPoint}
				<span class="text-sm text-text-muted">
					集合点：<span class="font-medium text-text">{route.meetingPoint}</span>
				</span>
			{/if}
			<span class="text-sm text-text-muted">
				时长：<span class="font-medium text-text">{route.duration} 分钟</span>
			</span>
		</div>

		<main class="flex flex-1 overflow-hidden">
			<div class="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-auto">
				<div class="px-4 py-3 border-b border-gray-100">
					<h3 class="text-sm font-semibold text-text">版本时间线</h3>
				</div>
				<div class="p-4">
					{#if itineraries.length === 0}
						<p class="text-sm text-text-muted text-center py-8">暂无行程版本</p>
					{:else}
						<div class="relative">
							<div class="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
							{#each itineraries as itin, i (itin.id)}
								<button
									onclick={() => (selectedVersionIndex = i)}
									class="relative flex w-full items-start gap-3 pb-5 text-left group"
								>
									<div class="relative z-10 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 {i === selectedVersionIndex
										? 'border-accent bg-accent text-white'
										: i === 0
											? 'border-primary bg-primary text-white'
											: 'border-gray-300 bg-white text-gray-400 group-hover:border-gray-400'} transition-colors">
										<span class="text-[10px] font-bold">{itin.version}</span>
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-medium {i === selectedVersionIndex ? 'text-text' : 'text-text-muted group-hover:text-text'} transition-colors">
											V{itin.version}
										</div>
										<div class="text-xs text-text-muted mt-0.5">{formatTime(itin.departureTime)}</div>
										{#if itin.guide}
											<div class="text-xs text-text-muted mt-0.5">导游：{itin.guide}</div>
										{/if}
										{#if itin.changeReason}
											<div class="text-xs text-accent mt-1 truncate">{itin.changeReason}</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="flex-1 overflow-auto p-8 bg-surface">
				{#if selectedItinerary}
					<div class="rounded-xl bg-white shadow-sm border border-gray-100">
						<div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
							<h2 class="font-serif text-lg font-semibold text-text">版本 {selectedItinerary.version} 详情</h2>
							<span class="text-xs text-text-muted">{formatTime(selectedItinerary.createdAt)}</span>
						</div>
						<div class="p-6 space-y-5">
							<div class="grid grid-cols-2 gap-5">
								<div>
									<label class="text-xs font-medium text-text-muted uppercase tracking-wider">出发时间</label>
									<p class="mt-1 text-sm text-text">{formatTime(selectedItinerary.departureTime)}</p>
								</div>
								<div>
									<label class="text-xs font-medium text-text-muted uppercase tracking-wider">导游</label>
									<p class="mt-1 text-sm text-text">{selectedItinerary.guide || '-'}</p>
								</div>
								<div>
									<label class="text-xs font-medium text-text-muted uppercase tracking-wider">操作人</label>
									<p class="mt-1 text-sm text-text">{selectedItinerary.operatorName} <span class="text-text-muted">({selectedItinerary.operatorId})</span></p>
								</div>
								<div>
									<label class="text-xs font-medium text-text-muted uppercase tracking-wider">变更原因</label>
									<p class="mt-1 text-sm text-accent">{selectedItinerary.changeReason}</p>
								</div>
							</div>

							<div>
								<label class="text-xs font-medium text-text-muted uppercase tracking-wider">行程内容</label>
								<pre class="mt-2 rounded-lg bg-surface p-4 text-sm text-text overflow-auto max-h-80 border border-gray-200 font-mono leading-relaxed">{formatContent(selectedItinerary.content)}</pre>
							</div>

							<div class="border-t border-gray-100 pt-4">
								<label class="text-xs font-medium text-text-muted uppercase tracking-wider">变更记录</label>
								<div class="mt-2 flex items-center gap-3 rounded-lg bg-surface p-3 border border-gray-200">
									<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
										{selectedItinerary.operatorName?.[0] || '?'}
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm text-text">{selectedItinerary.operatorName} 创建了版本 {selectedItinerary.version}</p>
										<p class="text-xs text-text-muted">{formatTime(selectedItinerary.createdAt)}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-20 text-text-muted">
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
						<p class="text-lg">暂无行程版本</p>
						<p class="mt-1 text-sm">点击「编辑行程」创建第一个版本</p>
					</div>
				{/if}
			</div>
		</main>
	</div>

	{#if showEditPanel}
		<div class="fixed inset-0 z-50 flex justify-end">
			<div class="absolute inset-0 bg-black/30" onclick={closeEditPanel}></div>
			<div class="relative w-[480px] bg-white shadow-xl flex flex-col">
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h2 class="font-serif text-lg font-semibold text-text">编辑行程</h2>
					<button onclick={closeEditPanel} class="text-text-muted hover:text-text transition-colors">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
					</button>
				</div>
				<div class="flex-1 overflow-auto p-6 space-y-5">
					{#if submitError}
						<div class="rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">{submitError}</div>
					{/if}
					<div>
						<label class="block text-sm font-medium text-text mb-1.5">出发时间 *</label>
						<input
							type="datetime-local"
							bind:value={editForm.departureTime}
							class="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-text mb-1.5">导游</label>
						<input
							type="text"
							bind:value={editForm.guide}
							placeholder="导游姓名"
							class="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-text mb-1.5">行程内容 (JSON) *</label>
						<textarea
							bind:value={editForm.content}
							rows="10"
							placeholder="请输入 JSON 格式的行程内容，例如 stops 和 tips 数组"
							class="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-y"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-text mb-1.5">变更原因 *</label>
						<textarea
							bind:value={editForm.changeReason}
							rows="3"
							placeholder="说明本次变更的原因"
							class="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-y"
						></textarea>
					</div>
					<div class="rounded-lg bg-surface border border-gray-200 p-4 space-y-2">
						<label class="block text-xs font-medium text-text-muted uppercase tracking-wider">操作人信息</label>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-xs text-text-muted mb-1">操作人 ID</label>
								<input
									type="text"
									bind:value={editForm.operatorId}
									class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
								/>
							</div>
							<div>
								<label class="block text-xs text-text-muted mb-1">操作人姓名</label>
								<input
									type="text"
									bind:value={editForm.operatorName}
									class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
								/>
							</div>
						</div>
					</div>
				</div>
				<div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
					<button
						onclick={closeEditPanel}
						class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-gray-50"
					>
						取消
					</button>
					<button
						onclick={submitItinerary}
						disabled={submitting || !editForm.departureTime || !editForm.changeReason}
						class="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{submitting ? '提交中...' : '创建新版本'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showRollbackModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center">
			<div class="absolute inset-0 bg-black/30" onclick={closeRollbackModal}></div>
			<div class="relative w-[440px] rounded-xl bg-white shadow-xl">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="font-serif text-lg font-semibold text-text">回滚版本</h2>
					<p class="mt-1 text-sm text-text-muted">选择要回滚到的目标版本，系统将基于该版本创建新版本</p>
				</div>
				<div class="p-6 space-y-4">
					{#if submitError}
						<div class="rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">{submitError}</div>
					{/if}
					<div>
						<label class="block text-sm font-medium text-text mb-1.5">目标版本</label>
						<select
							bind:value={rollbackVersion}
							class="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
						>
							{#each itineraries as itin}
								<option value={itin.version}>V{itin.version} — {itin.changeReason}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-text mb-1.5">回滚原因 *</label>
						<textarea
							bind:value={rollbackReason}
							rows="3"
							placeholder="说明回滚原因"
							class="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-y"
						></textarea>
					</div>
				</div>
				<div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
					<button
						onclick={closeRollbackModal}
						class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-gray-50"
					>
						取消
					</button>
					<button
						onclick={submitRollback}
						disabled={submitting || !rollbackReason}
						class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{submitting ? '回滚中...' : '确认回滚'}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
