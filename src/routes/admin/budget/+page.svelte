<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Wallet,
		Plus,
		Download,
		ChevronDown,
		ChevronUp,
		Search,
		Filter,
		TrendingUp,
		TrendingDown,
		X,
		Check,
		Loader2
	} from 'lucide-svelte';
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import {
		formatCurrency,
		formatDate,
		formatNumber,
		statusToText,
		debounce
	} from '$lib/utils/format';
	import { mockGetAllBudgets, mockProjects } from '$lib/mock/service';
	import type { BudgetItem, Budget } from '$lib/server/db/schema';

	type BudgetWithItems = Budget & { items: BudgetItem[]; projectName: string | null };

	let budgets: BudgetWithItems[] = [];
	let loading = true;
	let expandedBudgetId: string | null = null;
	let showAddModal = false;
	let addingItem = false;
	let selectedProjectId = '';
	let keyword = '';
	let categoryFilter = '';

	let categories = ['物资采购', '宣传费用', '人员费用', '场地费用', '交通费用', '其他'];

	let newItem: Partial<BudgetItem> = {
		itemName: '',
		amount: '',
		category: '',
		recipient: '',
		invoiceNo: '',
		remark: ''
	};

	let totalBudget = 0;
	let totalUsed = 0;

	$: {
		totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
		totalUsed = budgets.reduce((sum, b) => sum + parseFloat(b.usedAmount || '0'), 0);
	}

	$: filteredBudgets = budgets.filter((b) => {
		if (keyword && !b.projectName?.toLowerCase().includes(keyword.toLowerCase())) {
			return false;
		}
		return true;
	});

	async function loadBudgets() {
		loading = true;
		try {
			const data = await mockGetAllBudgets();
			budgets = data as BudgetWithItems[];
		} finally {
			loading = false;
		}
	}

	function toggleExpand(id: string) {
		expandedBudgetId = expandedBudgetId === id ? null : id;
	}

	function openAddModal(projectId: string) {
		selectedProjectId = projectId;
		newItem = {
			itemName: '',
			amount: '',
			category: categories[0],
			recipient: '',
			invoiceNo: '',
			remark: ''
		};
		showAddModal = true;
	}

	async function handleAddItem() {
		if (!newItem.itemName || !newItem.amount) {
			toast.warning('请填写项目名称和金额');
			return;
		}
		addingItem = true;
		try {
			await new Promise((r) => setTimeout(r, 500));
			toast.success('支出项已添加');
			showAddModal = false;
			loadBudgets();
		} finally {
			addingItem = false;
		}
	}

	const handleSearch = debounce((e: Event) => {
		const target = e.target as HTMLInputElement;
		keyword = target.value;
	}, 300);

	onMount(() => {
		loadBudgets();
	});
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">预算总额</p>
				<Wallet class="w-5 h-5 text-primary" />
			</div>
			<p class="text-3xl font-bold text-text-primary">{formatCurrency(totalBudget)}</p>
			<p class="text-sm text-text-muted mt-1">共 {budgets.length} 个项目预算</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">已使用金额</p>
				<TrendingDown class="w-5 h-5 text-danger" />
			</div>
			<p class="text-3xl font-bold text-text-primary">{formatCurrency(totalUsed)}</p>
			<p class="text-sm text-text-muted mt-1">
				使用率：{totalBudget > 0 ? ((totalUsed / totalBudget) * 100).toFixed(1) : 0}%
			</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">剩余预算</p>
				<TrendingUp class="w-5 h-5 text-success" />
			</div>
			<p class="text-3xl font-bold text-text-primary">{formatCurrency(totalBudget - totalUsed)}</p>
			<div class="mt-3 h-2 bg-surface-alt rounded-full overflow-hidden">
				<div
					class="h-full bg-gradient-to-r from-success to-success/70 rounded-full"
					style={`width: ${totalBudget > 0 ? Math.max(0, ((totalBudget - totalUsed) / totalBudget) * 100) : 0}%`}
				/>
			</div>
		</div>
	</div>

	<div class="card p-4">
		<div class="flex flex-col sm:flex-row sm:items-center gap-4">
			<div class="flex items-center gap-2 flex-shrink-0">
				<Filter class="w-4 h-4 text-text-muted" />
				<span class="text-sm font-medium text-text-primary">筛选</span>
			</div>
			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<input
					type="text"
					placeholder="搜索项目名称..."
					class="input pl-10 text-sm"
					on:input={handleSearch}
				/>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="card p-8">
			<div class="animate-pulse space-y-4">
				{#each Array(3) as _}
					<div class="h-24 bg-surface-alt rounded-xl" />
				{/each}
			</div>
		</div>
	{:else if filteredBudgets.length === 0}
		<div class="card p-16 text-center">
			<Wallet class="w-16 h-16 text-text-muted mx-auto mb-4" />
			<h3 class="font-display text-lg font-semibold text-text-primary mb-2">暂无预算数据</h3>
			<p class="text-text-secondary">请先创建项目预算</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredBudgets as budget}
				{@const percentage = parseFloat(budget.totalAmount) > 0
					? (parseFloat(budget.usedAmount) / parseFloat(budget.totalAmount)) * 100
					: 0}
				<div class="card overflow-hidden">
					<button
						on:click={() => toggleExpand(budget.id)}
						class="w-full p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-surface-alt/50 transition-colors text-left"
					>
						<div class="flex items-center gap-4 flex-1 min-w-0">
							<div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
								<Wallet class="w-6 h-6 text-primary" />
							</div>
							<div class="min-w-0">
								<h3 class="font-semibold text-text-primary truncate">
									{budget.projectName || '未命名项目'}
								</h3>
								<p class="text-sm text-text-muted">
									总预算 {formatCurrency(budget.totalAmount)} · 已使用 {formatCurrency(budget.usedAmount)}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<div class="w-40 hidden sm:block">
								<div class="flex justify-between text-xs text-text-muted mb-1">
									<span>使用率</span>
									<span>{percentage.toFixed(1)}%</span>
								</div>
								<div class="h-2 bg-surface-alt rounded-full overflow-hidden">
									<div
										class="h-full rounded-full transition-all {
											percentage > 90 ? 'bg-danger' : percentage > 70 ? 'bg-warning' : 'bg-success'
										}"
										style={`width: ${Math.min(100, percentage)}%`}
									/>
								</div>
							</div>
							<button
								on:click|stopPropagation={() => openAddModal(budget.projectId)}
								class="btn btn-primary text-sm py-2 px-3"
							>
								<Plus class="w-4 h-4" />
								添加支出
							</button>
							{#if expandedBudgetId === budget.id}
								<ChevronUp class="w-5 h-5 text-text-muted" />
							{:else}
								<ChevronDown class="w-5 h-5 text-text-muted" />
							{/if}
						</div>
					</button>

					{#if expandedBudgetId === budget.id}
						<div class="border-t border-border-light">
							{#if budget.items?.length === 0}
								<div class="p-8 text-center text-text-muted">
									暂无支出记录
								</div>
							{:else}
								<div class="overflow-x-auto">
									<table class="w-full">
										<thead class="bg-surface-alt">
											<tr>
												<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">支出项目</th>
												<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">类别</th>
												<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">金额</th>
												<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">日期</th>
												<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">收款方</th>
												<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">发票号</th>
												<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">备注</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-border-light">
											{#each budget.items || [] as item}
												<tr class="hover:bg-surface-alt/50">
													<td class="px-5 py-3 text-sm font-medium text-text-primary">{item.itemName}</td>
													<td class="px-5 py-3">
														<span class="badge bg-secondary/10 text-secondary">{item.category || '-'}</span>
													</td>
													<td class="px-5 py-3 text-sm font-semibold text-danger">
														-{formatCurrency(item.amount)}
													</td>
													<td class="px-5 py-3 text-sm text-text-secondary">
														{item.expenseDate ? formatDate(item.expenseDate) : '-'}
													</td>
													<td class="px-5 py-3 text-sm text-text-secondary">{item.recipient || '-'}</td>
													<td class="px-5 py-3 text-sm text-text-secondary">{item.invoiceNo || '-'}</td>
													<td class="px-5 py-3 text-sm text-text-muted">{item.remark || '-'}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if showAddModal}
		<div
			class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
			on:click={() => (showAddModal = false)}
		>
			<div
				class="card w-full max-w-lg animate-scale-in"
				on:click|stopPropagation
			>
				<div class="p-5 border-b border-border-light flex items-center justify-between">
					<h3 class="font-display text-lg font-semibold text-text-primary">添加支出项</h3>
					<button
						on:click={() => (showAddModal = false)}
						class="p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
					>
						<X class="w-5 h-5 text-text-muted" />
					</button>
				</div>
				<div class="p-5 space-y-4">
					<div>
						<label class="block text-sm font-medium text-text-primary mb-1.5">支出项目 *</label>
						<input
							type="text"
							bind:value={newItem.itemName}
							class="input"
							placeholder="如：清洁工具采购"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-text-primary mb-1.5">金额 (元) *</label>
							<input
								type="number"
								bind:value={newItem.amount}
								class="input"
								placeholder="0.00"
								step="0.01"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-text-primary mb-1.5">类别</label>
							<select bind:value={newItem.category} class="input">
								{#each categories as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-text-primary mb-1.5">收款方</label>
						<input
							type="text"
							bind:value={newItem.recipient}
							class="input"
							placeholder="收款单位或个人"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-text-primary mb-1.5">发票号</label>
						<input
							type="text"
							bind:value={newItem.invoiceNo}
							class="input"
							placeholder="发票编号"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-text-primary mb-1.5">备注</label>
						<textarea
							bind:value={newItem.remark}
							class="input min-h-[80px]"
							placeholder="支出说明"
						/>
					</div>
				</div>
				<div class="p-5 border-t border-border-light flex justify-end gap-3">
					<button
						on:click={() => (showAddModal = false)}
						class="btn btn-ghost"
					>
						取消
					</button>
					<button
						on:click={handleAddItem}
						disabled={addingItem}
						class="btn btn-primary disabled:opacity-50"
					>
						{#if addingItem}
							<Loader2 class="w-4 h-4 animate-spin" />
							保存中...
						{:else}
							<Check class="w-4 h-4" />
							确认添加
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
