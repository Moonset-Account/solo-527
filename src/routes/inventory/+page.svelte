<script lang="ts">
	let { data } = $props();

	let inventories = $state(data.inventories);
	let logs = $state(data.logs);
	let panelOpen = $state(false);
	let selectedInventory: any = $state(null);
	let errorMessage = $state('');
	let submitLoading = $state(false);

	let adjustType = $state('manual_adjust');
	let adjustQuantity = $state(0);
	let adjustReason = $state('');
	let routeFilter = $state('');
	let logPage = $state(1);
	const pageSize = 20;

	const lowInventories = $derived(
		inventories.filter((inv: any) => inv.available < 5 || (inv.total > 0 && inv.available < inv.total * 0.2))
	);

	const filteredLogs = $derived(() => {
		let result = logs;
		if (routeFilter) {
			result = result.filter((l: any) => l.routeId === routeFilter);
		}
		return result;
	});

	const pagedLogs = $derived(() => {
		return filteredLogs().slice(0, logPage * pageSize);
	});

	const hasMoreLogs = $derived(() => {
		return filteredLogs().length > logPage * pageSize;
	});

	function isLowInventory(inv: any): boolean {
		return inv.available < 5 || (inv.total > 0 && inv.available < inv.total * 0.2);
	}

	function progressPercent(inv: any): number {
		if (!inv.total || inv.total === 0) return 0;
		return Math.round((inv.available / inv.total) * 100);
	}

	function progressColor(inv: any): string {
		const pct = progressPercent(inv);
		if (pct > 50) return 'bg-success';
		if (pct > 20) return 'bg-warning';
		return 'bg-danger';
	}

	function typeLabel(type: string): string {
		switch (type) {
			case 'manual_adjust': return '手动调整';
			case 'order_deduct': return '订单扣减';
			case 'reserve_release': return '预留释放';
			case 'reserve_hold': return '预留锁定';
			default: return type;
		}
	}

	function typeBadgeClass(type: string): string {
		switch (type) {
			case 'manual_adjust': return 'bg-blue-500/15 text-blue-600';
			case 'order_deduct': return 'bg-accent/15 text-accent';
			case 'reserve_release': return 'bg-success/15 text-success';
			case 'reserve_hold': return 'bg-purple-500/15 text-purple-600';
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

	function openAdjustPanel(inv: any) {
		selectedInventory = inv;
		adjustType = 'manual_adjust';
		adjustQuantity = 0;
		adjustReason = '';
		errorMessage = '';
		panelOpen = true;
	}

	function closePanel() {
		panelOpen = false;
		selectedInventory = null;
	}

	async function submitAdjustment() {
		if (!selectedInventory) return;
		if (!adjustReason.trim()) {
			errorMessage = '调整依据不能为空';
			return;
		}
		if (adjustQuantity === 0) {
			errorMessage = '变动数量不能为0';
			return;
		}

		submitLoading = true;
		errorMessage = '';
		try {
			const res = await fetch(`/api/inventory/${selectedInventory.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: adjustType,
					quantity: adjustQuantity,
					reason: adjustReason.trim(),
					operatorId: 'admin',
					operatorName: '管理员'
				})
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '调整失败');
			}
			closePanel();
			await refreshData();
		} catch (e: any) {
			errorMessage = e.message || '调整失败';
		} finally {
			submitLoading = false;
		}
	}

	async function refreshData() {
		try {
			const [invRes, logRes] = await Promise.all([
				fetch('/api/inventory'),
				fetch('/api/inventory/logs')
			]);
			const invData = await invRes.json();
			const logData = await logRes.json();
			inventories = invData.inventories || [];
			logs = logData.logs || [];
		} catch (e) {
			console.error('刷新数据失败', e);
		}
	}

	function loadMoreLogs() {
		logPage += 1;
	}
</script>

<svelte:head>
	<title>库存看板 - 导览协作</title>
</svelte:head>

<div class="flex flex-1 flex-col overflow-auto">
	<header class="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
		<h1 class="font-serif text-2xl font-bold text-text">库存看板</h1>
		<div class="flex items-center gap-3">
			{#if lowInventories.length > 0}
				<span class="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
					<span class="inline-block h-2 w-2 rounded-full bg-danger animate-pulse"></span>
					{lowInventories.length} 项低库存
				</span>
			{/if}
			<span class="text-sm text-text-muted">共 {inventories.length} 条路线</span>
		</div>
	</header>

	<main class="flex-1 p-8">
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 mb-8">
			{#each inventories as inv (inv.id)}
				{@const low = isLowInventory(inv)}
				{@const pct = progressPercent(inv)}
				<div class="group rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
					{#if low}
						<div class="h-1.5 bg-gradient-to-r from-danger to-warning animate-pulse"></div>
					{:else}
						<div class="h-1.5 bg-gradient-to-r from-primary to-primary-light"></div>
					{/if}
					<div class="p-5">
						<div class="flex items-start justify-between mb-4">
							<h3 class="font-serif text-base font-semibold text-text leading-tight line-clamp-1">{inv.routeName || '未知路线'}</h3>
							{#if low}
								<span class="ml-2 flex-shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">低库存</span>
							{/if}
						</div>

						<div class="mb-4">
							<div class="flex items-center justify-between text-xs text-text-muted mb-1.5">
								<span>库存余量</span>
								<span class="font-medium text-text">{inv.available} / {inv.total}</span>
							</div>
							<div class="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
								<div
									class="h-full rounded-full transition-all {progressColor(inv)}"
									style="width: {pct}%"
								></div>
							</div>
						</div>

						<div class="grid grid-cols-3 gap-3 mb-4">
							<div class="text-center rounded-lg bg-success/5 py-2">
								<div class="text-lg font-bold text-success">{inv.available}</div>
								<div class="text-[10px] text-text-muted">可用</div>
							</div>
							<div class="text-center rounded-lg bg-accent/5 py-2">
								<div class="text-lg font-bold text-accent">{inv.sold}</div>
								<div class="text-[10px] text-text-muted">已售</div>
							</div>
							<div class="text-center rounded-lg bg-purple-500/5 py-2">
								<div class="text-lg font-bold text-purple-600">{inv.reserved}</div>
								<div class="text-[10px] text-text-muted">预留</div>
							</div>
						</div>

						<button
							type="button"
							onclick={() => openAdjustPanel(inv)}
							class="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white hover:border-primary"
						>
							调整
						</button>
					</div>
				</div>
			{/each}
		</div>

		<div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
			<div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
				<h2 class="font-serif text-lg font-semibold text-text">库存变更记录</h2>
				<select
					bind:value={routeFilter}
					class="rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
				>
					<option value="">全部路线</option>
					{#each inventories as inv}
						<option value={inv.routeId}>{inv.routeName}</option>
					{/each}
				</select>
			</div>

			{#if filteredLogs().length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-text-muted">
					<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3 opacity-40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
					<p class="text-base">暂无变更记录</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-surface text-text-muted text-xs">
								<th class="px-6 py-3 text-left font-medium">时间</th>
								<th class="px-6 py-3 text-left font-medium">路线</th>
								<th class="px-6 py-3 text-left font-medium">类型</th>
								<th class="px-6 py-3 text-right font-medium">变动前</th>
								<th class="px-6 py-3 text-right font-medium">变动后</th>
								<th class="px-6 py-3 text-right font-medium">数量</th>
								<th class="px-6 py-3 text-left font-medium">操作人</th>
								<th class="px-6 py-3 text-left font-medium">备注</th>
							</tr>
						</thead>
						<tbody>
							{#each pagedLogs() as log (log.id)}
								<tr class="border-t border-gray-50 hover:bg-surface/50 transition-colors">
									<td class="px-6 py-3 text-text-muted whitespace-nowrap">{formatTime(log.createdAt)}</td>
									<td class="px-6 py-3 text-text font-medium">{log.routeName || '-'}</td>
									<td class="px-6 py-3">
										<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {typeBadgeClass(log.type)}">
											{typeLabel(log.type)}
										</span>
									</td>
									<td class="px-6 py-3 text-right text-text-muted font-mono">{log.beforeValue}</td>
									<td class="px-6 py-3 text-right text-text font-mono font-medium">{log.afterValue}</td>
									<td class="px-6 py-3 text-right font-mono {log.quantity > 0 ? 'text-success' : 'text-danger'}">
										{log.quantity > 0 ? '+' : ''}{log.quantity}
									</td>
									<td class="px-6 py-3 text-text-muted">{log.operatorName || '-'}</td>
									<td class="px-6 py-3 text-text-muted max-w-[200px] truncate" title={log.reason}>{log.reason || '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if hasMoreLogs()}
					<div class="flex justify-center border-t border-gray-100 py-4">
						<button
							type="button"
							onclick={loadMoreLogs}
							class="rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm text-primary font-medium transition-colors hover:bg-primary hover:text-white hover:border-primary"
						>
							加载更多
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</main>
</div>

{#if panelOpen && selectedInventory}
	<div class="fixed inset-0 z-40 flex justify-end">
		<div class="absolute inset-0 bg-black/30" onclick={closePanel} role="presentation"></div>
		<div class="relative z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 class="font-serif text-lg font-semibold text-text">库存调整</h2>
				<button type="button" onclick={closePanel} class="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-6 space-y-5">
				{#if errorMessage}
					<div class="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
						{errorMessage}
					</div>
				{/if}

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">路线名称</label>
					<input
						type="text"
						value={selectedInventory.routeName || ''}
						disabled
						class="w-full rounded-lg border border-gray-200 bg-surface px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
					/>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">调整类型</label>
					<select
						bind:value={adjustType}
						class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
					>
						<option value="manual_adjust">手动调整</option>
						<option value="order_deduct">订单扣减</option>
						<option value="reserve_release">预留释放</option>
						<option value="reserve_hold">预留锁定</option>
					</select>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">变动数量</label>
					<input
						type="number"
						bind:value={adjustQuantity}
						class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
						placeholder="正数增加，负数减少"
					/>
					<p class="mt-1 text-xs text-text-muted">正数为增加，负数为减少</p>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">调整依据 <span class="text-danger">*</span></label>
					<textarea
						bind:value={adjustReason}
						rows={3}
						class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
						placeholder="请输入调整依据..."
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
					onclick={submitAdjustment}
					disabled={submitLoading}
					class="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{submitLoading ? '提交中...' : '提交调整'}
				</button>
			</div>
		</div>
	</div>
{/if}
