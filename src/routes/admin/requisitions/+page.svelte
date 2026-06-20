<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentUser } from '$stores/user';
	import DataTable from '$components/DataTable.svelte';
	import StatCard from '$components/StatCard.svelte';
	import { FileText, Check, X, Eye, RefreshCw, Filter } from 'lucide-svelte';
	import { formatDate } from '$utils/format';
	import { mockRequisitions } from '$server/mockData';
	import type { Requisition, Column, Status } from '$types';

	let requisitions = $state<Requisition[]>([]);
	let loading = $state(true);
	let statusFilter = $state<Status | 'all'>('all');
	let selectedRequisition = $state<Requisition | null>(null);
	let showDetailModal = $state(false);
	let showRejectModal = $state(false);
	let rejectReason = $state('');

	let user = $derived(get(currentUser));
	let isAdmin = $derived(user?.role === 'admin');

	let filteredRequisitions = $derived(requisitions.filter((r) => {
		if (statusFilter !== 'all' && r.status !== statusFilter) return false;
		return true;
	}));

	let stats = $derived({
		total: requisitions.length,
		pending: requisitions.filter((r) => r.status === 'pending').length,
		approved: requisitions.filter((r) => r.status === 'approved').length,
		completed: requisitions.filter((r) => r.status === 'completed').length
	});

	onMount(async () => {
		try {
			requisitions = [...mockRequisitions];
		} catch (e) {
			console.error('Failed to load requisitions:', e);
		} finally {
			loading = false;
		}
	});

	async function refreshData() {
		loading = true;
		try {
			requisitions = [...mockRequisitions];
		} catch (e) {
			console.error('Failed to refresh data:', e);
		} finally {
			loading = false;
		}
	}

	function viewDetail(req: Requisition) {
		selectedRequisition = req;
		showDetailModal = true;
	}

	function openRejectModal(req: Requisition) {
		selectedRequisition = req;
		rejectReason = '';
		showRejectModal = true;
	}

	async function handleApprove(id: string) {
		if (!confirm('确定要批准这个领用申请吗？')) return;

		try {
			const idx = requisitions.findIndex((r) => r.id === id);
			if (idx >= 0) {
				requisitions[idx].status = 'approved';
				requisitions = [...requisitions];
			}
		} catch (e) {
			console.error('Failed to approve requisition:', e);
			alert('批准失败，请重试');
		}
	}

	async function handleReject() {
		if (!selectedRequisition || !rejectReason.trim()) {
			alert('请填写拒绝原因');
			return;
		}

		try {
			const idx = requisitions.findIndex((r) => r.id === selectedRequisition.id);
			if (idx >= 0) {
				requisitions[idx].status = 'rejected';
				requisitions[idx].rejectionReason = rejectReason;
				requisitions = [...requisitions];
			}
			showRejectModal = false;
			selectedRequisition = null;
		} catch (e) {
			console.error('Failed to reject requisition:', e);
			alert('拒绝失败，请重试');
		}
	}

	const columns: Column<Requisition>[] = [
		{
			key: 'reagentName',
			label: '试剂名称',
			render: (item) => item.reagent?.name || '未知试剂',
			className: 'font-medium text-gray-900'
		},
		{
			key: 'quantity',
			label: '数量',
			render: (item) => `${item.quantity} ${item.reagent?.unit || ''}`
		},
		{
			key: 'userName',
			label: '申请人',
			required: true
		},
		{
			key: 'purpose',
			label: '用途',
			className: 'max-w-xs truncate'
		},
		{
			key: 'status',
			label: '状态',
			required: true
		},
		{
			key: 'createdAt',
			label: '申请时间',
			render: (item) => formatDate(item.createdAt)
		},
		{
			key: 'actions',
			label: '操作',
			render: () => ({ type: 'actions' as const })
		}
	];

	const statusOptions: { value: Status | 'all'; label: string }[] = [
		{ value: 'all', label: '全部状态' },
		{ value: 'pending', label: '待审批' },
		{ value: 'approved', label: '已批准' },
		{ value: 'rejected', label: '已拒绝' },
		{ value: 'completed', label: '已完成' }
	];
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">领用申请审批</h1>
			<p class="text-gray-500">审批和管理所有试剂领用申请</p>
		</div>
		<button
			on:click={refreshData}
			disabled={loading}
			class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
		>
			<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
			刷新
		</button>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			title="总申请数"
			value={stats.total}
			icon={FileText}
			color="indigo"
			trend="neutral"
			trendValue="记录"
		/>
		<StatCard
			title="待审批"
			value={stats.pending}
			icon={FileText}
			color="yellow"
			trend="neutral"
			trendValue="待处理"
		/>
		<StatCard
			title="已批准"
			value={stats.approved}
			icon={FileText}
			color="green"
			trend="up"
			trendValue="通过"
		/>
		<StatCard
			title="已完成"
			value={stats.completed}
			icon={FileText}
			color="green"
			trend="up"
			trendValue="已领取"
		/>
	</div>

	<div class="card">
		<div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
			<div class="flex items-center gap-2">
				<Filter class="w-4 h-4 text-gray-400" />
				<span class="text-sm text-gray-500">筛选：</span>
			</div>
			<div class="flex flex-wrap gap-2">
				<select
					bind:value={statusFilter}
					class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					{#each statusOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
		</div>

		{#if loading}
			<div class="p-12 text-center">
				<div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
				<p class="text-gray-500">加载中...</p>
			</div>
		{:else if filteredRequisitions.length === 0}
			<div class="p-12 text-center">
				<div class="text-5xl mb-4">📋</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">暂无申请</h3>
				<p class="text-gray-500">
					{statusFilter !== 'all' ? '没有找到匹配的筛选结果' : '还没有任何领用申请'}
				</p>
			</div>
		{:else}
			<DataTable
				data={filteredRequisitions}
				{columns}
				emptyText="暂无领用申请"
				actions={({ item }: { item: Requisition }) => (
					<div class="flex items-center gap-2">
						<button
							onclick={() => viewDetail(item)}
							class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
							title="查看详情"
						>
							<Eye class="w-4 h-4" />
						</button>
						{#if isAdmin && item.status === 'pending'}
							<button
								onclick={() => handleApprove(item.id)}
								class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
								title="批准"
							>
								<Check class="w-4 h-4" />
							</button>
							<button
								onclick={() => openRejectModal(item)}
								class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								title="拒绝"
							>
								<X class="w-4 h-4" />
							</button>
						{/if}
					</div>
				)}
			/>
		{/if}
	</div>
</div>

{#if showDetailModal && selectedRequisition}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => showDetailModal = false}>
		<div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-in">
			<div class="p-6 border-b border-gray-100">
				<div class="flex items-start justify-between">
					<div>
						<h3 class="text-xl font-bold text-gray-900 mb-1">
							领用申请详情
						</h3>
						<p class="text-sm text-gray-500">
							申请时间：{formatDate(selectedRequisition.createdAt)}
						</p>
					</div>
					<button
						on:click={() => showDetailModal = false}
						class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
			<div class="p-6 overflow-y-auto max-h-[60vh]">
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="bg-gray-50 rounded-lg p-3">
							<p class="text-xs text-gray-500 mb-1">试剂名称</p>
							<p class="font-medium text-gray-900">{selectedRequisition.reagent?.name}</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<p class="text-xs text-gray-500 mb-1">CAS号</p>
							<p class="font-medium text-gray-900 font-mono text-sm">{selectedRequisition.reagent?.casNumber}</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<p class="text-xs text-gray-500 mb-1">申请数量</p>
							<p class="font-medium text-gray-900">{selectedRequisition.quantity} {selectedRequisition.reagent?.unit}</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<p class="text-xs text-gray-500 mb-1">当前库存</p>
							<p class="font-medium text-gray-900">{selectedRequisition.reagent?.stock} {selectedRequisition.reagent?.unit}</p>
						</div>
					</div>
					<div class="bg-gray-50 rounded-lg p-3">
						<p class="text-xs text-gray-500 mb-1">申请人</p>
						<p class="font-medium text-gray-900">{selectedRequisition.userName}</p>
					</div>
					<div class="bg-gray-50 rounded-lg p-3">
						<p class="text-xs text-gray-500 mb-1">用途</p>
						<p class="font-medium text-gray-900">{selectedRequisition.purpose}</p>
					</div>
					<div class="bg-gray-50 rounded-lg p-3">
						<p class="text-xs text-gray-500 mb-1">状态</p>
						<span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
							selectedRequisition.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
							selectedRequisition.status === 'approved' ? 'bg-green-100 text-green-700' :
							selectedRequisition.status === 'rejected' ? 'bg-red-100 text-red-700' :
							'bg-green-100 text-green-700'
						}`}>
							{selectedRequisition.status === 'pending' ? '待审批' :
							 selectedRequisition.status === 'approved' ? '已批准' :
							 selectedRequisition.status === 'rejected' ? '已拒绝' : '已完成'}
						</span>
					</div>
					{#if selectedRequisition.rejectionReason}
						<div class="bg-red-50 rounded-lg p-3">
							<p class="text-xs text-red-500 mb-1">拒绝原因</p>
							<p class="font-medium text-red-700">{selectedRequisition.rejectionReason}</p>
						</div>
					{/if}
				</div>
			</div>
			<div class="p-4 border-t border-gray-100 flex justify-end gap-3">
				{#if isAdmin && selectedRequisition.status === 'pending'}
					<button
						on:click={() => { handleApprove(selectedRequisition.id); showDetailModal = false; }}
						class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
					>
						<Check class="w-4 h-4" />
						批准
					</button>
					<button
						on:click={() => { showDetailModal = false; openRejectModal(selectedRequisition); }}
						class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
					>
						<X class="w-4 h-4" />
						拒绝
					</button>
				{/if}
				<button
					on:click={() => showDetailModal = false}
					class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
				>
					关闭
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showRejectModal && selectedRequisition}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => showRejectModal = false}>
		<div class="bg-white rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
			<div class="p-6 border-b border-gray-100">
				<h3 class="text-xl font-bold text-gray-900 mb-1">拒绝申请</h3>
				<p class="text-sm text-gray-500">
					请填写拒绝原因
				</p>
			</div>
			<div class="p-6">
				<textarea
					bind:value={rejectReason}
					placeholder="请输入拒绝原因..."
					rows={4}
					class="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
				/>
			</div>
			<div class="p-4 border-t border-gray-100 flex justify-end gap-3">
				<button
					on:click={() => showRejectModal = false}
					class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
				>
					取消
				</button>
				<button
					on:click={handleReject}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
				>
					确认拒绝
				</button>
			</div>
		</div>
	</div>
{/if}
