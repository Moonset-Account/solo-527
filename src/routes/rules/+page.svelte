<script lang="ts">
	let { data } = $props();

	let rules = $state<any[]>(data.rules);
	let modalOpen = $state(false);
	let editingRuleId = $state<string | null>(null);
	let errorMessage = $state('');
	let submitLoading = $state(false);

	let formName = $state('');
	let formConditionType = $state('inventory_below');
	let formThreshold = $state(10);
	let formTimeWindow = $state(30);
	let formMethod = $state('sms');
	let formRecipients = $state('');
	let formEscalationMinutes = $state(0);

	const conditionTypeLabels: Record<string, string> = {
		inventory_below: '库存低于阈值',
		inventory_change_rate: '库存变动幅度',
		time_window: '时间窗口'
	};

	const methodLabels: Record<string, string> = {
		sms: '短信',
		wechat: '微信',
		app_push: 'App推送',
		email: '邮件'
	};

	const conditionSummary = $derived(
		conditionTypeLabels[formConditionType] || formConditionType
	);

	const actionSummary = $derived(
		`${methodLabels[formMethod] || formMethod} → ${formRecipients || '未设置'}`
	);

	function getConditionSummary(rule: any): string {
		const c = rule.condition || {};
		const typeLabel = conditionTypeLabels[c.type] || c.type || '未知';
		let summary = typeLabel;
		if (c.threshold !== undefined) summary += `，阈值: ${c.threshold}`;
		if (c.timeWindow !== undefined) summary += `，窗口: ${c.timeWindow}分钟`;
		return summary;
	}

	function getActionSummary(rule: any): string {
		const a = rule.action || {};
		const methodLabel = methodLabels[a.method] || a.method || '未知';
		let summary = methodLabel;
		if (a.recipients) summary += ` → ${a.recipients}`;
		if (a.escalationMinutes && a.escalationMinutes > 0) summary += `，超时${a.escalationMinutes}分钟升级`;
		return summary;
	}

	function openNewRuleModal() {
		editingRuleId = null;
		formName = '';
		formConditionType = 'inventory_below';
		formThreshold = 10;
		formTimeWindow = 30;
		formMethod = 'sms';
		formRecipients = '';
		formEscalationMinutes = 0;
		errorMessage = '';
		modalOpen = true;
	}

	function openEditModal(rule: any) {
		editingRuleId = rule.id;
		formName = rule.name || '';
		const c = rule.condition || {};
		formConditionType = c.type || 'inventory_below';
		formThreshold = c.threshold || 10;
		formTimeWindow = c.timeWindow || 30;
		const a = rule.action || {};
		formMethod = a.method || 'sms';
		formRecipients = a.recipients || '';
		formEscalationMinutes = a.escalationMinutes || 0;
		errorMessage = '';
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		editingRuleId = null;
	}

	function buildCondition() {
		const cond: Record<string, any> = {
			type: formConditionType,
			threshold: formThreshold
		};
		if (formConditionType === 'time_window' || formConditionType === 'inventory_change_rate') {
			cond.timeWindow = formTimeWindow;
		}
		return cond;
	}

	function buildAction() {
		return {
			method: formMethod,
			recipients: formRecipients,
			escalationMinutes: formEscalationMinutes
		};
	}

	async function submitRule() {
		if (!formName.trim()) {
			errorMessage = '规则名称不能为空';
			return;
		}
		if (!formRecipients.trim()) {
			errorMessage = '接收人不能为空';
			return;
		}

		submitLoading = true;
		errorMessage = '';
		try {
			const payload = {
				name: formName.trim(),
				condition: buildCondition(),
				action: buildAction(),
				operatorId: 'admin',
				operatorName: '管理员'
			};

			let res: Response;
			if (editingRuleId) {
				res = await fetch(`/api/rules/${editingRuleId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				res = await fetch('/api/rules', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '保存失败');
			}

			closeModal();
			await refreshData();
		} catch (e: any) {
			errorMessage = e.message || '保存失败';
		} finally {
			submitLoading = false;
		}
	}

	async function toggleRule(rule: any) {
		try {
			const res = await fetch(`/api/rules/${rule.id}/toggle`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					operatorId: 'admin',
					operatorName: '管理员'
				})
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '切换失败');
			}
			await refreshData();
		} catch (e) {
			console.error('切换规则状态失败', e);
		}
	}

	async function refreshData() {
		try {
			const res = await fetch('/api/rules');
			const d = await res.json();
			rules = d.rules || [];
		} catch (e) {
			console.error('刷新数据失败', e);
		}
	}

	function formatTime(ts: string): string {
		if (!ts) return '-';
		return new Date(ts).toLocaleString('zh-CN', {
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit'
		});
	}

	const showTimeWindow = $derived(
		formConditionType === 'time_window' || formConditionType === 'inventory_change_rate'
	);
</script>

<svelte:head>
	<title>提醒规则配置 - 导览协作</title>
</svelte:head>

<div class="flex flex-1 flex-col overflow-auto">
	<header class="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
		<h1 class="font-serif text-2xl font-bold text-text">提醒规则配置</h1>
		<button
			type="button"
			onclick={openNewRuleModal}
			class="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
		>
			新增规则
		</button>
	</header>

	<main class="flex-1 p-8">
		{#if rules.length === 0}
			<div class="flex flex-col items-center justify-center py-24 text-text-muted">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-30"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
				<p class="text-lg font-serif">暂无提醒规则</p>
				<p class="mt-1 text-sm">点击"新增规则"创建第一条规则</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each rules as rule (rule.id)}
					<div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4 {rule.enabled ? 'border-l-success' : 'border-l-gray-300'}">
						<div class="p-5">
							<div class="flex items-center justify-between mb-3">
								<h3 class="font-serif text-base font-semibold text-text">{rule.name}</h3>
								<div class="flex items-center gap-3">
									<button
										type="button"
										onclick={() => openEditModal(rule)}
										class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white hover:border-primary"
									>
										编辑
									</button>
									<label class="relative inline-flex cursor-pointer items-center">
										<input
											type="checkbox"
											class="peer sr-only"
											checked={rule.enabled}
											onchange={() => toggleRule(rule)}
										/>
										<div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-success peer-checked:after:translate-x-full"></div>
									</label>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div class="rounded-lg bg-surface px-4 py-3">
									<div class="text-xs font-medium text-text-muted mb-1">触发条件</div>
									<div class="text-sm text-text">{getConditionSummary(rule)}</div>
								</div>
								<div class="rounded-lg bg-surface px-4 py-3">
									<div class="text-xs font-medium text-text-muted mb-1">执行动作</div>
									<div class="text-sm text-text">{getActionSummary(rule)}</div>
								</div>
							</div>

							<div class="mt-3 flex items-center gap-4 text-xs text-text-muted">
								<span>操作人: {rule.operatorName || '-'}</span>
								<span>创建时间: {formatTime(rule.createdAt)}</span>
								<span>更新时间: {formatTime(rule.updatedAt)}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

{#if modalOpen}
	<div class="fixed inset-0 z-40 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/30" onclick={closeModal} role="presentation"></div>
		<div class="relative z-50 w-full max-w-lg bg-white shadow-2xl rounded-xl max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 class="font-serif text-lg font-semibold text-text">{editingRuleId ? '编辑规则' : '新增规则'}</h2>
				<button type="button" onclick={closeModal} class="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>

			<div class="p-6 space-y-5">
				{#if errorMessage}
					<div class="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
						{errorMessage}
					</div>
				{/if}

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">规则名称</label>
					<input
						type="text"
						bind:value={formName}
						class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
						placeholder="输入规则名称"
					/>
				</div>

				<div class="rounded-lg border border-gray-100 bg-surface p-4 space-y-4">
					<h3 class="text-sm font-semibold text-text">触发条件</h3>

					<div>
						<label class="mb-1.5 block text-sm font-medium text-text">条件类型</label>
						<select
							bind:value={formConditionType}
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
						>
							<option value="inventory_below">库存低于阈值</option>
							<option value="inventory_change_rate">库存变动幅度</option>
							<option value="time_window">时间窗口</option>
						</select>
					</div>

					<div>
						<label class="mb-1.5 block text-sm font-medium text-text">阈值</label>
						<input
							type="number"
							bind:value={formThreshold}
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
							placeholder="输入阈值"
						/>
					</div>

					{#if showTimeWindow}
						<div>
							<label class="mb-1.5 block text-sm font-medium text-text">时间窗口（分钟）</label>
							<input
								type="number"
								bind:value={formTimeWindow}
								class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
								placeholder="输入时间窗口"
							/>
						</div>
					{/if}
				</div>

				<div class="rounded-lg border border-gray-100 bg-surface p-4 space-y-4">
					<h3 class="text-sm font-semibold text-text">执行动作</h3>

					<div>
						<label class="mb-1.5 block text-sm font-medium text-text">通知方式</label>
						<select
							bind:value={formMethod}
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
						>
							<option value="sms">短信</option>
							<option value="wechat">微信</option>
							<option value="app_push">App推送</option>
							<option value="email">邮件</option>
						</select>
					</div>

					<div>
						<label class="mb-1.5 block text-sm font-medium text-text">接收人</label>
						<input
							type="text"
							bind:value={formRecipients}
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
							placeholder="多个接收人用逗号分隔"
						/>
					</div>

					<div>
						<label class="mb-1.5 block text-sm font-medium text-text">超时升级时间（分钟）</label>
						<input
							type="number"
							bind:value={formEscalationMinutes}
							class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
							placeholder="填0表示不升级"
						/>
						<p class="mt-1 text-xs text-text-muted">填0表示不升级</p>
					</div>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">操作人</label>
					<div class="flex gap-3">
						<input
							type="text"
							value="admin"
							disabled
							class="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
						/>
						<input
							type="text"
							value="管理员"
							disabled
							class="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
						/>
					</div>
				</div>
			</div>

			<div class="border-t border-gray-200 px-6 py-4">
				<button
					type="button"
					onclick={submitRule}
					disabled={submitLoading}
					class="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{submitLoading ? '保存中...' : '保存规则'}
				</button>
			</div>
		</div>
	</div>
{/if}
