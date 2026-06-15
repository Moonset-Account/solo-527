<script lang="ts">
	type ReminderItem = {
		reminder: {
			id: string;
			urgencyLevel: string;
			message: string;
			status: string;
			dueDate: string | null;
			createdAt: string;
			handledAt: string | null;
			handlerRemark: string | null;
			treatmentCardId: string | null;
		};
		customer: { id: string; name: string; phone: string } | null;
		rule: { id: string; name: string; type: string } | null;
		card: { id: string; serviceName: string } | null;
	};

	type RuleItem = {
		id: string;
		name: string;
		type: string;
		conditionDays: number;
		urgencyLevel: string;
		messageTemplate: string | null;
		isActive: boolean;
		createdAt: string;
	};

	let reminders = $state<ReminderItem[]>([]);
	let rules = $state<RuleItem[]>([]);
	let activeCards = $state<any[]>([]);
	let loading = $state(true);
	let generating = $state(false);

	let urgencyFilter = $state<string>('');
	let statusFilter = $state<string>('pending');
	let activeTab = $state<'reminders' | 'rules'>('reminders');

	let handleModal = $state<{ open: boolean; reminder: ReminderItem | null; action: string }>({
		open: false,
		reminder: null,
		action: ''
	});
	let handlerRemark = $state('');

	let ruleModal = $state<{ open: boolean; rule: RuleItem | null }>({ open: false, rule: null });
	let ruleForm = $state({
		name: '',
		type: 'no_visit',
		conditionDays: 30,
		urgencyLevel: 'warning',
		messageTemplate: '',
		isActive: true
	});

	let generatingResult = $state<{ count: number } | null>(null);

	const urgencyOptions = [
		{ value: '', label: '全部' },
		{ value: 'urgent', label: '🔴 紧急' },
		{ value: 'warning', label: '🟡 警告' },
		{ value: 'info', label: '🔵 提示' }
	];

	const statusOptions = [
		{ value: 'pending', label: '待处理' },
		{ value: 'sent', label: '已发送' },
		{ value: 'completed', label: '已完成' },
		{ value: 'dismissed', label: '已忽略' }
	];

	const urgencyStyles: Record<string, { border: string; bg: string; text: string; badge: string; icon: string; pulse: string }> = {
		urgent: {
			border: 'border-l-4 border-l-red-500',
			bg: 'bg-red-50',
			text: 'text-red-800',
			badge: 'bg-red-100 text-red-700',
			icon: '🔴',
			pulse: 'animate-pulse'
		},
		warning: {
			border: 'border-l-4 border-l-amber-500',
			bg: 'bg-amber-50',
			text: 'text-amber-800',
			badge: 'bg-amber-100 text-amber-700',
			icon: '🟡',
			pulse: ''
		},
		info: {
			border: 'border-l-4 border-l-blue-500',
			bg: 'bg-blue-50',
			text: 'text-blue-800',
			badge: 'bg-blue-100 text-blue-700',
			icon: '🔵',
			pulse: ''
		}
	};

	const typeLabels: Record<string, string> = {
		treatment_expire: '疗程过期',
		no_visit: '久未到店'
	};

	const urgencyLabels: Record<string, string> = {
		urgent: '紧急',
		warning: '警告',
		info: '提示'
	};

	let filteredReminders = $derived(
		reminders.filter((item) => {
			if (urgencyFilter && item.reminder.urgencyLevel !== urgencyFilter) return false;
			if (statusFilter && item.reminder.status !== statusFilter) return false;
			return true;
		})
	);

	let sortedRules = $derived(
		[...rules].sort((a, b) => {
			if (a.type !== b.type) return a.type.localeCompare(b.type);
			return b.conditionDays - a.conditionDays;
		})
	);

	let pendingCount = $derived(reminders.filter((r) => r.reminder.status === 'pending').length);

	async function loadReminders() {
		try {
			const params = new URLSearchParams();
			if (urgencyFilter) params.set('urgencyLevel', urgencyFilter);
			if (statusFilter) params.set('status', statusFilter);
			const res = await fetch(`/api/reminders?${params}`);
			reminders = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	async function loadRules() {
		try {
			const res = await fetch('/api/reminder-rules');
			rules = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	async function loadCards() {
		try {
			const res = await fetch('/api/treatment-cards?status=active');
			activeCards = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	async function generateReminders() {
		generating = true;
		generatingResult = null;
		try {
			const res = await fetch('/api/reminders', { method: 'POST' });
			const data = await res.json();
			generatingResult = { count: data.count ?? 0 };
			await loadReminders();
		} catch (e) {
			console.error(e);
		} finally {
			generating = false;
		}
	}

	async function handleReminder() {
		if (!handleModal.reminder) return;
		try {
			await fetch('/api/reminders', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: handleModal.reminder.reminder.id,
					status: handleModal.action,
					handlerRemark
				})
			});
			handleModal = { open: false, reminder: null, action: '' };
			handlerRemark = '';
			await loadReminders();
		} catch (e) {
			console.error(e);
		}
	}

	async function saveRule() {
		try {
			if (ruleModal.rule) {
				await fetch('/api/reminder-rules', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: ruleModal.rule.id, ...ruleForm })
				});
			} else {
				await fetch('/api/reminder-rules', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(ruleForm)
				});
			}
			ruleModal = { open: false, rule: null };
			ruleForm = { name: '', type: 'no_visit', conditionDays: 30, urgencyLevel: 'warning', messageTemplate: '', isActive: true };
			await loadRules();
		} catch (e) {
			console.error(e);
		}
	}

	async function toggleRuleActive(rule: RuleItem) {
		try {
			await fetch('/api/reminder-rules', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: rule.id, isActive: !rule.isActive })
			});
			await loadRules();
		} catch (e) {
			console.error(e);
		}
	}

	function openHandleModal(item: ReminderItem, action: string) {
		handleModal = { open: true, reminder: item, action };
		handlerRemark = '';
	}

	function openRuleModal(rule?: RuleItem) {
		if (rule) {
			ruleForm = {
				name: rule.name,
				type: rule.type,
				conditionDays: rule.conditionDays,
				urgencyLevel: rule.urgencyLevel,
				messageTemplate: rule.messageTemplate ?? '',
				isActive: rule.isActive
			};
			ruleModal = { open: true, rule };
		} else {
			ruleForm = { name: '', type: 'no_visit', conditionDays: 30, urgencyLevel: 'warning', messageTemplate: '', isActive: true };
			ruleModal = { open: true, rule: null };
		}
	}

	function getCardInfo(treatmentCardId: string | null) {
		if (!treatmentCardId) return null;
		return activeCards.find((c: any) => c.card?.id === treatmentCardId);
	}

	$effect(() => {
		Promise.all([loadReminders(), loadRules(), loadCards()]).finally(() => {
			loading = false;
		});
	});

	$effect(() => {
		loadReminders();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">提醒管理</h2>
			<p class="mt-1 text-sm text-gray-500">管理客户提醒和提醒规则</p>
		</div>
		<button
			onclick={generateReminders}
			disabled={generating}
			class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors {generating ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			{generating ? '生成中...' : '一键生成提醒'}
		</button>
	</div>

	{#if generatingResult}
		<div class="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
			成功生成 {generatingResult.count} 条新提醒
		</div>
	{/if}

	{#if pendingCount > 0}
		<div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
			当前有 {pendingCount} 条待处理提醒
		</div>
	{/if}

	<div class="flex gap-2 border-b border-gray-200">
		<button
			onclick={() => (activeTab = 'reminders')}
			class="px-4 py-3 text-sm font-medium transition-colors relative {activeTab === 'reminders' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}"
		>
			提醒列表
			{#if pendingCount > 0}
				<span class="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">{pendingCount}</span>
			{/if}
			{#if activeTab === 'reminders'}
				<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
			{/if}
		</button>
		<button
			onclick={() => (activeTab = 'rules')}
			class="px-4 py-3 text-sm font-medium transition-colors relative {activeTab === 'rules' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}"
		>
			提醒规则
			{#if activeTab === 'rules'}
				<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
			{/if}
		</button>
	</div>

	{#if activeTab === 'reminders'}
		<div class="space-y-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap gap-2">
					{#each urgencyOptions as opt}
						<button
							onclick={() => (urgencyFilter = opt.value)}
							class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors {urgencyFilter === opt.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>
				<div class="flex flex-wrap gap-2">
					{#each statusOptions as opt}
						<button
							onclick={() => (statusFilter = opt.value)}
							class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors {statusFilter === opt.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-20">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
				</div>
			{:else if filteredReminders.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-gray-400">
					<svg class="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
					</svg>
					<p>暂无提醒数据</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredReminders as item (item.reminder.id)}
						{@const style = urgencyStyles[item.reminder.urgencyLevel] ?? urgencyStyles.info}
						{@const cardInfo = getCardInfo(item.reminder.treatmentCardId)}
						<div class="rounded-xl bg-white shadow-sm overflow-hidden {style.border}">
							<div class="p-4 {style.bg}">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-2">
											<span class="{style.pulse}">{style.icon}</span>
											<span class="font-semibold text-gray-800">{item.customer?.name ?? '未知客户'}</span>
											<span class="text-sm text-gray-500">{item.customer?.phone ?? ''}</span>
											<span class="rounded-full px-2 py-0.5 text-xs font-medium {style.badge}">
												{urgencyLabels[item.reminder.urgencyLevel] ?? item.reminder.urgencyLevel}
											</span>
										</div>
										{#if item.card?.serviceName || cardInfo}
											<div class="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
												<span class="rounded bg-white/60 px-2 py-0.5 text-xs">
													💅 {item.card?.serviceName ?? cardInfo?.card?.serviceName ?? ''}
												</span>
												{#if cardInfo?.card}
													<span class="rounded bg-white/60 px-2 py-0.5 text-xs">
														剩余 {cardInfo.card.totalSessions - cardInfo.card.usedSessions}/{cardInfo.card.totalSessions} 次
													</span>
													<span class="rounded bg-white/60 px-2 py-0.5 text-xs">
														到期 {cardInfo.card.expireDate}
													</span>
												{/if}
											</div>
										{/if}
										<p class="text-sm {style.text} mb-1">{item.reminder.message}</p>
										<div class="flex flex-wrap items-center gap-3 text-xs text-gray-500">
											{#if item.reminder.dueDate}
												<span>📅 到期: {item.reminder.dueDate}</span>
											{/if}
											{#if item.rule}
												<span>📌 规则: {item.rule.name}</span>
											{/if}
										</div>
									</div>
								</div>
								{#if item.reminder.status === 'pending'}
									<div class="mt-3 flex flex-wrap gap-2">
										<button
											onclick={() => openHandleModal(item, 'sent')}
											class="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
										>
											标记已发送
										</button>
										<button
											onclick={() => openHandleModal(item, 'completed')}
											class="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors"
										>
											标记已完成
										</button>
										<button
											onclick={() => openHandleModal(item, 'dismissed')}
											class="rounded-lg bg-gray-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-500 transition-colors"
										>
											忽略
										</button>
									</div>
								{:else}
									<div class="mt-3 flex items-center gap-2 text-xs text-gray-500">
										<span class="rounded-full px-2 py-0.5 {item.reminder.status === 'sent' ? 'bg-blue-100 text-blue-600' : item.reminder.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}">
											{statusOptions.find((s) => s.value === item.reminder.status)?.label ?? item.reminder.status}
										</span>
										{#if item.reminder.handlerRemark}
											<span>备注: {item.reminder.handlerRemark}</span>
										{/if}
										{#if item.reminder.handledAt}
											<span>{new Date(item.reminder.handledAt).toLocaleString('zh-CN')}</span>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			<div class="flex justify-end">
				<button
					onclick={() => openRuleModal()}
					class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					新增规则
				</button>
			</div>

			{#if sortedRules.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-gray-400">
					<svg class="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
					<p>暂无提醒规则</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each sortedRules as rule (rule.id)}
						{@const style = urgencyStyles[rule.urgencyLevel] ?? urgencyStyles.info}
						<div class="rounded-xl bg-white shadow-sm p-5">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-2">
										<span class="font-semibold text-gray-800">{rule.name}</span>
										<span class="rounded-full px-2 py-0.5 text-xs font-medium {rule.type === 'treatment_expire' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}">
											{typeLabels[rule.type] ?? rule.type}
										</span>
										<span class="rounded-full px-2 py-0.5 text-xs font-medium {style.badge}">
											{urgencyLabels[rule.urgencyLevel] ?? rule.urgencyLevel}
										</span>
									</div>
									<p class="text-sm text-gray-600 mb-1">
										{rule.type === 'treatment_expire' ? `到期前 ${rule.conditionDays} 天` : `${rule.conditionDays} 天未到店`}
									</p>
									{#if rule.messageTemplate}
										<p class="text-xs text-gray-400 bg-gray-50 rounded p-2 mt-2 line-clamp-2">{rule.messageTemplate}</p>
									{/if}
								</div>
								<div class="flex items-center gap-3">
									<button
										onclick={() => toggleRuleActive(rule)}
										class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {rule.isActive ? 'bg-primary' : 'bg-gray-300'}"
									>
										<span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {rule.isActive ? 'translate-x-6' : 'translate-x-1'}"></span>
									</button>
									<button
										onclick={() => openRuleModal(rule)}
										class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if handleModal.open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={() => (handleModal = { open: false, reminder: null, action: '' })}>
		<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-gray-800 mb-4">
				{handleModal.action === 'sent' ? '标记已发送' : handleModal.action === 'completed' ? '标记已完成' : '忽略提醒'}
			</h3>
			{#if handleModal.reminder}
				<div class="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
					<p class="font-medium">{handleModal.reminder.customer?.name ?? '未知客户'}</p>
					<p class="mt-1">{handleModal.reminder.reminder.message}</p>
				</div>
			{/if}
			<div class="mb-4">
				<label class="mb-1 block text-sm font-medium text-gray-700">处理备注</label>
				<textarea
					bind:value={handlerRemark}
					rows="3"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
					placeholder="输入备注信息（可选）"
				></textarea>
			</div>
			<div class="flex justify-end gap-3">
				<button
					onclick={() => (handleModal = { open: false, reminder: null, action: '' })}
					class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
				>
					取消
				</button>
				<button
					onclick={handleReminder}
					class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors {handleModal.action === 'completed' ? 'bg-green-500 hover:bg-green-600' : handleModal.action === 'sent' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'}"
				>
					确认
				</button>
			</div>
		</div>
	</div>
{/if}

{#if ruleModal.open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={() => (ruleModal = { open: false, rule: null })}>
		<div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-gray-800 mb-4">
				{ruleModal.rule ? '编辑规则' : '新增规则'}
			</h3>
			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">规则名称</label>
					<input
						type="text"
						bind:value={ruleForm.name}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
						placeholder="如：疗程即将过期提醒"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">规则类型</label>
					<select
						bind:value={ruleForm.type}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
					>
						<option value="no_visit">久未到店</option>
						<option value="treatment_expire">疗程过期</option>
					</select>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">
						{ruleForm.type === 'treatment_expire' ? '到期前天数' : '未到店天数'}
					</label>
					<input
						type="number"
						bind:value={ruleForm.conditionDays}
						min="1"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
					/>
					<p class="mt-1 text-xs text-gray-400">
						{ruleForm.type === 'treatment_expire' ? '疗程到期前 N 天发送提醒' : 'N 天未到店时发送提醒'}
					</p>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">紧急程度</label>
					<div class="flex gap-2">
						{#each [
							{ value: 'urgent', label: '紧急', color: 'bg-red-500' },
							{ value: 'warning', label: '警告', color: 'bg-amber-500' },
							{ value: 'info', label: '提示', color: 'bg-blue-500' }
						] as opt}
							<button
								type="button"
								onclick={() => (ruleForm.urgencyLevel = opt.value)}
								class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors {ruleForm.urgencyLevel === opt.value ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}"
							>
								<span class="h-3 w-3 rounded-full {opt.color}"></span>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">消息模板</label>
					<textarea
						bind:value={ruleForm.messageTemplate}
						rows="3"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
						placeholder="输入提醒消息模板"
					></textarea>
					<p class="mt-1 text-xs text-gray-400">
						可用变量: {'{serviceName}'}, {'{expireDate}'}, {'{remaining}'}, {'{name}'}
					</p>
				</div>
				<div class="flex items-center gap-3">
					<label class="text-sm font-medium text-gray-700">启用规则</label>
					<button
						type="button"
						onclick={() => (ruleForm.isActive = !ruleForm.isActive)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {ruleForm.isActive ? 'bg-primary' : 'bg-gray-300'}"
					>
						<span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {ruleForm.isActive ? 'translate-x-6' : 'translate-x-1'}"></span>
					</button>
				</div>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					onclick={() => (ruleModal = { open: false, rule: null })}
					class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
				>
					取消
				</button>
				<button
					onclick={saveRule}
					class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
				>
					{ruleModal.rule ? '保存' : '创建'}
				</button>
			</div>
		</div>
	</div>
{/if}
