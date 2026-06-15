<script lang="ts">
	const today = new Date().toISOString().split('T')[0];
	const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

	let records = $state<any[]>([]);
	let dateFrom = $state(monthStart);
	let dateTo = $state(today);
	let showModal = $state(false);
	let expandedId = $state<string | null>(null);
	let customers = $state<any[]>([]);
	let services = $state<any[]>([]);
	let technicians = $state<any[]>([]);
	let customerCards = $state<any[]>([]);
	let customerSearch = $state('');
	let selectedCustomerId = $state('');
	let selectedServiceId = $state('');
	let selectedTechnicianId = $state('');
	let formAmount = $state('');
	let formPaymentMethod = $state('cash');
	let formType = $state('service');
	let formCardId = $state('');
	let formRemark = $state('');
	let showCustomerDropdown = $state(false);
	let submitting = $state(false);

	$effect(() => {
		loadReferenceData();
	});

	$effect(() => {
		const from = dateFrom;
		const to = dateTo;
		if (from && to) loadRecords(from, to);
	});

	async function loadReferenceData() {
		const [cRes, sRes, tRes] = await Promise.all([
			fetch('/api/customers').then(r => r.json()),
			fetch('/api/services').then(r => r.json()),
			fetch('/api/technicians?active=true').then(r => r.json())
		]);
		customers = cRes;
		services = sRes;
		technicians = tRes;
	}

	async function loadRecords(from: string, to: string) {
		const res = await fetch(`/api/cashier?startDate=${from}&endDate=${to}`);
		records = await res.json();
	}

	function setQuickDate(type: string) {
		const now = new Date();
		dateTo = today;
		if (type === 'today') {
			dateFrom = today;
		} else if (type === 'week') {
			const day = now.getDay();
			const diff = day === 0 ? 6 : day - 1;
			const start = new Date(now);
			start.setDate(now.getDate() - diff);
			dateFrom = start.toISOString().split('T')[0];
		} else {
			dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
		}
	}

	let filteredCustomers = $derived(
		customerSearch.length === 0
			? customers.slice(0, 20)
			: customers.filter((c: any) => c.name.includes(customerSearch) || c.phone?.includes(customerSearch)).slice(0, 20)
	);

	let servicesByCategory = $derived.by(() => {
		const map = new Map<string, any[]>();
		for (const s of services) {
			if (!s.isActive) continue;
			const list = map.get(s.category) ?? [];
			list.push(s);
			map.set(s.category, list);
		}
		return map;
	});

	let summary = $derived({
		total: records.reduce((sum: number, r: any) => sum + Number(r.record?.amount ?? 0), 0),
		cash: records.filter((r: any) => r.record?.paymentMethod === 'cash').reduce((sum: number, r: any) => sum + Number(r.record?.amount ?? 0), 0),
		card: records.filter((r: any) => ['wechat', 'alipay', 'bank'].includes(r.record?.paymentMethod)).reduce((sum: number, r: any) => sum + Number(r.record?.amount ?? 0), 0),
		treatment: records.filter((r: any) => r.record?.paymentMethod === 'treatment_card').reduce((sum: number, r: any) => sum + Number(r.record?.amount ?? 0), 0)
	});

	async function loadCustomerCards(customerId: string) {
		if (!customerId) { customerCards = []; return; }
		const res = await fetch(`/api/treatment-cards?customerId=${customerId}&status=active`);
		customerCards = await res.json();
	}

	function onCustomerSelect(c: any) {
		selectedCustomerId = c.id;
		customerSearch = c.name;
		showCustomerDropdown = false;
		loadCustomerCards(c.id);
	}

	function onServiceChange(serviceId: string) {
		selectedServiceId = serviceId;
		const svc = services.find((s: any) => s.id === serviceId);
		if (svc) formAmount = svc.price;
	}

	async function handleSubmit() {
		if (!selectedCustomerId || !formAmount) return;
		submitting = true;
		try {
			await fetch('/api/cashier', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerId: selectedCustomerId,
					technicianId: selectedTechnicianId || undefined,
					serviceId: selectedServiceId || undefined,
					amount: formAmount,
					paymentMethod: formPaymentMethod,
					type: formType,
					treatmentCardId: formType === 'treatment' && formCardId ? formCardId : undefined,
					remark: formRemark || undefined
				})
			});
			showModal = false;
			resetForm();
			loadRecords(dateFrom, dateTo);
		} finally {
			submitting = false;
		}
	}

	function resetForm() {
		selectedCustomerId = '';
		selectedServiceId = '';
		selectedTechnicianId = '';
		formAmount = '';
		formPaymentMethod = 'cash';
		formType = 'service';
		formCardId = '';
		formRemark = '';
		customerSearch = '';
		customerCards = [];
		showCustomerDropdown = false;
	}

	const paymentMethodMap: Record<string, { label: string; cls: string }> = {
		cash: { label: '现金', cls: 'bg-green-100 text-green-700' },
		wechat: { label: '微信', cls: 'bg-emerald-100 text-emerald-700' },
		alipay: { label: '支付宝', cls: 'bg-blue-100 text-blue-700' },
		bank: { label: '银行卡', cls: 'bg-purple-100 text-purple-700' },
		treatment_card: { label: '疗程卡', cls: 'bg-pink-100 text-pink-700' }
	};

	const typeMap: Record<string, { label: string; cls: string }> = {
		service: { label: '服务', cls: 'bg-primary/10 text-primary' },
		treatment: { label: '疗程', cls: 'bg-amber-100 text-amber-700' },
		product: { label: '产品', cls: 'bg-gray-100 text-gray-600' }
	};

	function formatShortDate(d: string | Date) {
		if (!d) return '-';
		const date = new Date(d);
		return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
	}

	function truncate(s: string, len: number) {
		if (!s) return '-';
		return s.length > len ? s.slice(0, len) + '…' : s;
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-2">
			<input
				type="date"
				bind:value={dateFrom}
				class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
			/>
			<span class="text-gray-400 text-sm">至</span>
			<input
				type="date"
				bind:value={dateTo}
				class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
			/>
			<div class="flex gap-1">
				<button
					onclick={() => setQuickDate('today')}
					class="rounded-lg px-3 py-2 text-xs font-medium bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors"
				>今天</button>
				<button
					onclick={() => setQuickDate('week')}
					class="rounded-lg px-3 py-2 text-xs font-medium bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors"
				>本周</button>
				<button
					onclick={() => setQuickDate('month')}
					class="rounded-lg px-3 py-2 text-xs font-medium bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors"
				>本月</button>
			</div>
		</div>
		<button
			onclick={() => { resetForm(); showModal = true; }}
			class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors shadow-sm"
		>+ 新增记录</button>
	</div>

	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500 mb-1">总收入</p>
			<p class="text-xl font-bold text-primary">¥{summary.total.toLocaleString()}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500 mb-1">现金支付</p>
			<p class="text-xl font-bold text-green-600">¥{summary.cash.toLocaleString()}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500 mb-1">会员卡</p>
			<p class="text-xl font-bold text-blue-600">¥{summary.card.toLocaleString()}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500 mb-1">疗程扣费</p>
			<p class="text-xl font-bold text-accent">¥{summary.treatment.toLocaleString()}</p>
		</div>
	</div>

	<div class="rounded-xl bg-white shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-gray-50/80">
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">时间</th>
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">客户</th>
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">技师</th>
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">项目/服务</th>
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">金额</th>
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">支付方式</th>
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">类型</th>
						<th class="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">备注</th>
					</tr>
				</thead>
				<tbody>
					{#if records.length === 0}
						<tr>
							<td colspan="8" class="px-4 py-12 text-center text-gray-400">暂无收银记录</td>
						</tr>
					{/if}
					{#each records as item (item.record?.id)}
						{@const pm = paymentMethodMap[item.record?.paymentMethod] ?? { label: item.record?.paymentMethod, cls: 'bg-gray-100 text-gray-600' }}
						{@const tp = typeMap[item.record?.type] ?? { label: item.record?.type, cls: 'bg-gray-100 text-gray-600' }}
						<tr
							class="border-b border-gray-50 cursor-pointer hover:bg-pink-50/40 transition-colors"
							onclick={() => expandedId = expandedId === item.record?.id ? null : item.record?.id}
						>
							<td class="px-4 py-3 text-gray-500 whitespace-nowrap">{formatShortDate(item.record?.createdAt)}</td>
							<td class="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{item.customer?.name ?? '-'}</td>
							<td class="px-4 py-3 text-gray-700 whitespace-nowrap">{item.technician?.name ?? '-'}</td>
							<td class="px-4 py-3 text-gray-700 whitespace-nowrap">{item.service?.name ?? '-'}</td>
							<td class="px-4 py-3 font-bold text-red-500 whitespace-nowrap">¥{Number(item.record?.amount ?? 0).toLocaleString()}</td>
							<td class="px-4 py-3 whitespace-nowrap">
								<span class="rounded-full px-2 py-0.5 text-xs font-medium {pm.cls}">{pm.label}</span>
							</td>
							<td class="px-4 py-3 whitespace-nowrap">
								<span class="rounded-full px-2 py-0.5 text-xs font-medium {tp.cls}">{tp.label}</span>
							</td>
							<td class="px-4 py-3 text-gray-500 max-w-[120px] truncate">{truncate(item.record?.remark, 10)}</td>
						</tr>
						{#if expandedId === item.record?.id}
							<tr class="bg-pink-50/30">
								<td colspan="8" class="px-6 py-4">
									<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
										<div>
											<span class="text-gray-400">客户电话</span>
											<p class="font-medium text-gray-700">{item.customer?.phone ?? '-'}</p>
										</div>
										<div>
											<span class="text-gray-400">完整时间</span>
											<p class="font-medium text-gray-700">{new Date(item.record?.createdAt).toLocaleString('zh-CN')}</p>
										</div>
										<div>
											<span class="text-gray-400">支付方式</span>
											<p class="font-medium text-gray-700">{pm.label}</p>
										</div>
										<div>
											<span class="text-gray-400">类型</span>
											<p class="font-medium text-gray-700">{tp.label}</p>
										</div>
										{#if item.record?.treatmentCardId}
											<div>
												<span class="text-gray-400">疗程卡</span>
												<p class="font-medium text-gray-700">已关联</p>
											</div>
										{/if}
										{#if item.record?.remark}
											<div class="col-span-2">
												<span class="text-gray-400">备注</span>
												<p class="font-medium text-gray-700">{item.record.remark}</p>
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
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-10 px-4 overflow-y-auto" onclick={() => showModal = false}>
		<div class="w-full max-w-lg rounded-xl bg-white shadow-xl mb-10" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between border-b px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-800">新增收银记录</h2>
				<button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="space-y-4 px-6 py-5">
				<div class="relative">
					<label class="block text-sm font-medium text-gray-700 mb-1">客户 <span class="text-red-400">*</span></label>
					<input
						type="text"
						bind:value={customerSearch}
						onfocus={() => showCustomerDropdown = true}
						onblur={() => setTimeout(() => showCustomerDropdown = false, 200)}
						placeholder="搜索姓名或电话"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					/>
					{#if showCustomerDropdown && filteredCustomers.length > 0}
						<div class="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
							{#each filteredCustomers as c (c.id)}
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
					<label class="block text-sm font-medium text-gray-700 mb-1">服务项目</label>
					<select
						bind:value={selectedServiceId}
						onchange={() => onServiceChange(selectedServiceId)}
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					>
						<option value="">选择服务</option>
						{#each servicesByCategory as [category, items]}
							<optgroup label={category}>
								{#each items as s (s.id)}
									<option value={s.id}>{s.name} - ¥{s.price}</option>
								{/each}
							</optgroup>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">技师</label>
					<select
						bind:value={selectedTechnicianId}
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					>
						<option value="">选择技师</option>
						{#each technicians as t (t.id)}
							<option value={t.id}>{t.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">金额 <span class="text-red-400">*</span></label>
					<input
						type="number"
						bind:value={formAmount}
						step="0.01"
						min="0"
						placeholder="0.00"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
					<div class="flex flex-wrap gap-2">
						{#each [
							{ value: 'cash', label: '现金' },
							{ value: 'wechat', label: '微信' },
							{ value: 'alipay', label: '支付宝' },
							{ value: 'bank', label: '银行卡' },
							{ value: 'treatment_card', label: '疗程卡' }
						] as pm}
							<button
								type="button"
								onclick={() => formPaymentMethod = pm.value}
								class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {formPaymentMethod === pm.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}"
							>{pm.label}</button>
						{/each}
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">类型</label>
					<div class="flex gap-2">
						{#each [
							{ value: 'service', label: '服务' },
							{ value: 'treatment', label: '疗程' },
							{ value: 'product', label: '产品' }
						] as tp}
							<button
								type="button"
								onclick={() => formType = tp.value}
								class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {formType === tp.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}"
							>{tp.label}</button>
						{/each}
					</div>
				</div>

				{#if formType === 'treatment' && customerCards.length > 0}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">疗程卡</label>
						<select
							bind:value={formCardId}
							class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						>
							<option value="">选择疗程卡</option>
							{#each customerCards as cc (cc.card?.id)}
								<option value={cc.card?.id}>{cc.card?.serviceName} ({cc.card?.usedSessions}/{cc.card?.totalSessions})</option>
							{/each}
						</select>
					</div>
				{/if}

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
					<textarea
						bind:value={formRemark}
						rows="2"
						placeholder="可选备注"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
					></textarea>
				</div>
			</div>

			<div class="flex justify-end gap-3 border-t px-6 py-4">
				<button
					onclick={() => showModal = false}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
				>取消</button>
				<button
					onclick={handleSubmit}
					disabled={submitting || !selectedCustomerId || !formAmount}
					class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
				>{submitting ? '提交中...' : '确认提交'}</button>
			</div>
		</div>
	</div>
{/if}
