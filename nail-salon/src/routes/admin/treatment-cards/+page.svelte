<script lang="ts">
	const today = new Date().toISOString().split('T')[0];

	let cards = $state<any[]>([]);
	let customers = $state<any[]>([]);
	let statusFilter = $state('all');
	let customerSearch = $state('');
	let showModal = $state(false);
	let expandedId = $state<string | null>(null);
	let confirmingId = $state<string | null>(null);
	let customerSearchModal = $state('');
	let showCustomerDropdown = $state(false);
	let selectedCustomerId = $state('');
	let formServiceName = $state('');
	let formTotalSessions = $state('');
	let formPrice = $state('');
	let formStartDate = $state(today);
	let formExpireDate = $state('');
	let submitting = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const [cardsRes, custRes] = await Promise.all([
			fetch('/api/treatment-cards').then(r => r.json()),
			fetch('/api/customers').then(r => r.json())
		]);
		cards = cardsRes;
		customers = custRes;
	}

	function getDaysUntilExpiry(expireDate: string) {
		if (!expireDate) return Infinity;
		return Math.ceil((new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
	}

	function getEffectiveStatus(card: any) {
		if (Number(card.usedSessions) >= Number(card.totalSessions)) return 'completed';
		if (getDaysUntilExpiry(card.expireDate) < 0) return 'expired';
		if (getDaysUntilExpiry(card.expireDate) <= 7) return 'expiring_urgent';
		if (getDaysUntilExpiry(card.expireDate) <= 30) return 'expiring_warn';
		return 'active';
	}

	const statusConfig: Record<string, { label: string; cls: string; borderCls: string }> = {
		active: { label: '使用中', cls: 'bg-green-100 text-green-700', borderCls: 'border-l-green-500' },
		expiring_warn: { label: '即将过期', cls: 'bg-yellow-100 text-yellow-700', borderCls: 'border-l-yellow-400' },
		expiring_urgent: { label: '即将过期', cls: 'bg-yellow-100 text-yellow-700', borderCls: 'border-l-red-500' },
		expired: { label: '已过期', cls: 'bg-red-100 text-red-700', borderCls: 'border-l-red-500' },
		completed: { label: '已用完', cls: 'bg-gray-100 text-gray-500', borderCls: 'border-l-gray-400' }
	};

	let filteredCards = $derived(
		cards.filter((item: any) => {
			const eff = getEffectiveStatus(item.card);
			if (statusFilter === 'active' && !['active', 'expiring_warn', 'expiring_urgent'].includes(eff)) return false;
			if (statusFilter === 'expired' && eff !== 'expired') return false;
			if (statusFilter === 'completed' && eff !== 'completed') return false;
			if (customerSearch) {
				const name = item.customer?.name ?? '';
				if (!name.includes(customerSearch)) return false;
			}
			return true;
		})
	);

	let filteredCustomersModal = $derived(
		customerSearchModal.length === 0
			? customers.slice(0, 20)
			: customers.filter((c: any) => c.name.includes(customerSearchModal) || c.phone?.includes(customerSearchModal)).slice(0, 20)
	);

	async function useSession(card: any) {
		const newUsed = Number(card.usedSessions) + 1;
		const newStatus = newUsed >= Number(card.totalSessions) ? 'completed' : undefined;
		await fetch('/api/treatment-cards', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: card.id, usedSessions: newUsed, status: newStatus })
		});
		confirmingId = null;
		loadData();
	}

	async function handleSubmit() {
		if (!selectedCustomerId || !formServiceName || !formTotalSessions || !formPrice || !formStartDate || !formExpireDate) return;
		submitting = true;
		try {
			await fetch('/api/treatment-cards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerId: selectedCustomerId,
					serviceName: formServiceName,
					totalSessions: Number(formTotalSessions),
					price: formPrice,
					startDate: formStartDate,
					expireDate: formExpireDate
				})
			});
			showModal = false;
			resetForm();
			loadData();
		} finally {
			submitting = false;
		}
	}

	function resetForm() {
		selectedCustomerId = '';
		customerSearchModal = '';
		formServiceName = '';
		formTotalSessions = '';
		formPrice = '';
		formStartDate = today;
		formExpireDate = '';
		showCustomerDropdown = false;
	}

	function onCustomerSelect(c: any) {
		selectedCustomerId = c.id;
		customerSearchModal = c.name;
		showCustomerDropdown = false;
	}

	function getProgressColor(card: any) {
		const remaining = Number(card.totalSessions) - Number(card.usedSessions);
		if (remaining <= 0) return 'bg-gray-400';
		if (remaining <= 2) return 'bg-red-500';
		if (remaining <= 3) return 'bg-yellow-500';
		return 'bg-primary';
	}

	function getBorderClass(item: any) {
		const days = getDaysUntilExpiry(item.card?.expireDate);
		const eff = getEffectiveStatus(item.card);
		if (eff === 'completed') return 'border-l-4 ' + statusConfig.completed.borderCls;
		if (days <= 7 && days >= 0) return 'border-l-4 border-l-red-500 animate-pulse';
		if (days <= 30 && days >= 0) return 'border-l-4 border-l-yellow-400';
		if (days < 0) return 'border-l-4 ' + statusConfig.expired.borderCls;
		return 'border-l-4 ' + statusConfig.active.borderCls;
	}

	const filterTabs = [
		{ key: 'all', label: '全部' },
		{ key: 'active', label: '使用中' },
		{ key: 'expired', label: '已过期' },
		{ key: 'completed', label: '已用完' }
	];
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-2">
			{#each filterTabs as tab (tab.key)}
				<button
					onclick={() => statusFilter = tab.key}
					class="rounded-lg px-3 py-2 text-xs font-medium transition-colors {statusFilter === tab.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}"
				>{tab.label}</button>
			{/each}
			<div class="relative">
				<input
					type="text"
					bind:value={customerSearch}
					placeholder="搜索客户姓名"
					class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-40"
				/>
			</div>
		</div>
		<button
			onclick={() => { resetForm(); showModal = true; }}
			class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors shadow-sm"
		>+ 新建疗程卡</button>
	</div>

	{#if filteredCards.length === 0}
		<div class="rounded-xl bg-white p-12 text-center text-gray-400 shadow-sm">暂无疗程卡数据</div>
	{/if}

	<div class="space-y-3">
		{#each filteredCards as item (item.card?.id)}
			{@const card = item.card}
			{@const eff = getEffectiveStatus(card)}
			{@const sc = statusConfig[eff] ?? statusConfig.active}
			{@const remaining = Number(card.totalSessions) - Number(card.usedSessions)}
			{@const progress = Number(card.totalSessions) > 0 ? (Number(card.usedSessions) / Number(card.totalSessions)) * 100 : 0}
			{@const days = getDaysUntilExpiry(card.expireDate)}
			<div
				class="rounded-xl bg-white shadow-sm overflow-hidden {getBorderClass(item)}"
				onclick={() => expandedId = expandedId === card.id ? null : card.id}
			>
				<div class="p-4 cursor-pointer">
					<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
						<div class="min-w-[80px]">
							<span class="text-xs text-gray-400">客户</span>
							<p class="font-bold text-gray-800">{item.customer?.name ?? '-'}</p>
						</div>
						<div class="min-w-[100px]">
							<span class="text-xs text-gray-400">疗程项目</span>
							<p class="font-medium text-gray-700">{card.serviceName}</p>
						</div>
						<div class="min-w-[120px]">
							<span class="text-xs text-gray-400">剩余/总次数</span>
							<div class="flex items-center gap-2">
								<span class="font-bold text-lg {remaining <= 3 ? (remaining <= 0 ? 'text-gray-400' : 'text-red-500') : 'text-primary'}">{card.usedSessions}/{card.totalSessions}</span>
								<div class="flex-1 h-2 rounded-full bg-gray-100 min-w-[60px]">
									<div class="h-full rounded-full transition-all {getProgressColor(card)}" style="width: {progress}%"></div>
								</div>
							</div>
						</div>
						<div class="min-w-[80px]">
							<span class="text-xs text-gray-400">金额</span>
							<p class="font-semibold text-gray-700">¥{Number(card.price).toLocaleString()}</p>
						</div>
						<div class="min-w-[140px]">
							<span class="text-xs text-gray-400">有效期</span>
							<p class="text-sm text-gray-600 {days <= 30 && days >= 0 ? 'font-semibold text-yellow-600' : ''} {days < 0 ? 'text-red-500 font-semibold' : ''}">
								{card.startDate} ~ {card.expireDate}
								{#if days < 0}
									<span class="text-xs">(已过期)</span>
								{:else if days <= 7}
									<span class="text-xs">(剩{days}天)</span>
								{:else if days <= 30}
									<span class="text-xs">(剩{days}天)</span>
								{/if}
							</p>
						</div>
						<div>
							<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {sc.cls}">{sc.label}</span>
						</div>
					</div>
				</div>

				{#if expandedId === card.id}
					<div class="border-t bg-gray-50/50 px-4 py-4" onclick={(e) => e.stopPropagation()}>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
							<div>
								<span class="text-gray-400">客户电话</span>
								<p class="font-medium text-gray-700">{item.customer?.phone ?? '-'}</p>
							</div>
							<div>
								<span class="text-gray-400">已用次数</span>
								<p class="font-medium text-gray-700">{card.usedSessions} 次</p>
							</div>
							<div>
								<span class="text-gray-400">剩余次数</span>
								<p class="font-medium text-gray-700">{remaining} 次</p>
							</div>
							<div>
								<span class="text-gray-400">创建时间</span>
								<p class="font-medium text-gray-700">{new Date(card.createdAt).toLocaleDateString('zh-CN')}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							{#if remaining > 0 && days >= 0}
								{#if confirmingId === card.id}
									<span class="text-sm text-red-600 font-medium">确认核销1次？</span>
									<button
										onclick={() => useSession(card)}
										class="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
									>确认核销</button>
									<button
										onclick={() => confirmingId = null}
										class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
									>取消</button>
								{:else}
									<button
										onclick={() => confirmingId = card.id}
										class="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
									>核销</button>
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-10 px-4 overflow-y-auto" onclick={() => showModal = false}>
		<div class="w-full max-w-lg rounded-xl bg-white shadow-xl mb-10" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between border-b px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-800">新建疗程卡</h2>
				<button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="space-y-4 px-6 py-5">
				<div class="relative">
					<label class="block text-sm font-medium text-gray-700 mb-1">客户 <span class="text-red-400">*</span></label>
					<input
						type="text"
						bind:value={customerSearchModal}
						onfocus={() => showCustomerDropdown = true}
						onblur={() => setTimeout(() => showCustomerDropdown = false, 200)}
						placeholder="搜索姓名或电话"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					/>
					{#if showCustomerDropdown && filteredCustomersModal.length > 0}
						<div class="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
							{#each filteredCustomersModal as c (c.id)}
								<button
									onmousedown={() => onCustomerSelect(c)}
									class="w-full px-3 py-2 text-left text-sm hover:bg-pink-50 flex justify-between items-center"
								>
									<span class="font-medium">{c.name}</span>
									<span class="text-gray-400 text-xs">{c.phone}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">疗程项目 <span class="text-red-400">*</span></label>
					<input
						type="text"
						bind:value={formServiceName}
						placeholder="如：基础护理10次卡"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">总次数 <span class="text-red-400">*</span></label>
						<input
							type="number"
							bind:value={formTotalSessions}
							min="1"
							placeholder="10"
							class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">价格 <span class="text-red-400">*</span></label>
						<input
							type="number"
							bind:value={formPrice}
							step="0.01"
							min="0"
							placeholder="0.00"
							class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">开始日期 <span class="text-red-400">*</span></label>
						<input
							type="date"
							bind:value={formStartDate}
							class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">到期日期 <span class="text-red-400">*</span></label>
						<input
							type="date"
							bind:value={formExpireDate}
							class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						/>
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-3 border-t px-6 py-4">
				<button
					onclick={() => showModal = false}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
				>取消</button>
				<button
					onclick={handleSubmit}
					disabled={submitting || !selectedCustomerId || !formServiceName || !formTotalSessions || !formPrice || !formExpireDate}
					class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
				>{submitting ? '提交中...' : '确认创建'}</button>
			</div>
		</div>
	</div>
{/if}
