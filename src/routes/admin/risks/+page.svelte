<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentUser } from '$stores/user';
	import DataTable from '$components/DataTable.svelte';
	import StatCard from '$components/StatCard.svelte';
	import RiskAlert from '$components/RiskAlert.svelte';
	import { AlertTriangle, Eye, RefreshCw, Filter } from 'lucide-svelte';
	import { formatDate } from '$utils/format';
	import { mockRisks, getRiskStats } from '$server/mockData';
	import type { RiskAlert as RiskAlertType, Column, Status, HazardLevel } from '$types';

	let risks = $state<RiskAlertType[]>([]);
	let loading = $state(true);
	let statusFilter = $state<Status | 'all'>('all');
	let levelFilter = $state<HazardLevel | 'all'>('all');
	let riskStats = $state(getRiskStats());
	let selectedRisk = $state<RiskAlertType | null>(null);
	let showDetailModal = $state(false);

	let user = $derived(get(currentUser));
	let isAdmin = $derived(user?.role === 'admin');

	let filteredRisks = $derived(risks.filter((r) => {
		if (statusFilter !== 'all' && r.status !== statusFilter) return false;
		if (levelFilter !== 'all' && r.riskLevel !== levelFilter) return false;
		return true;
	}));

	onMount(async () => {
		try {
			risks = [...mockRisks];
		} catch (e) {
			console.error('Failed to load risks:', e);
		} finally {
			loading = false;
		}
	});

	async function refreshData() {
		loading = true;
		try {
			risks = [...mockRisks];
			riskStats = getRiskStats();
		} catch (e) {
			console.error('Failed to refresh data:', e);
		} finally {
			loading = false;
		}
	}

	function viewDetail(risk: RiskAlertType) {
		selectedRisk = risk;
		showDetailModal = true;
	}

	async function handleProcess(id: string) {
		try {
			const res = await fetch(`/api/risks?id=${id}&action=process`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					userName: user.name
				})
			});
			if (!res.ok) throw new Error('处理失败');
			const idx = risks.findIndex((r) => r.id === id);
			if (idx >= 0) {
				risks[idx].status = 'processing';
				risks = [...risks];
			}
			riskStats = getRiskStats();
		} catch (e) {
			console.error('Failed to process risk:', e);
			alert('处理失败，请重试');
		}
	}

	async function handleResolve(id: string, resolution: string) {
		try {
			const res = await fetch(`/api/risks?id=${id}&action=resolve`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					resolution,
					userId: user.id,
					userName: user.name
				})
			});
			if (!res.ok) throw new Error('解决失败');
			const idx = risks.findIndex((r) => r.id === id);
			if (idx >= 0) {
				risks[idx].status = 'resolved';
				risks[idx].resolution = resolution;
				risks[idx].resolvedAt = new Date();
				risks = [...risks];
			}
			riskStats = getRiskStats();
			showDetailModal = false;
		} catch (e) {
			console.error('Failed to resolve risk:', e);
			alert('解决失败，请重试');
		}
	}

	const columns: Column<RiskAlertType>[] = [
		{
			key: 'reagentName',
			label: '试剂名称',
			className: 'font-medium text-gray-900'
		},
		{
			key: 'riskType',
			label: '风险类型'
		},
		{
			key: 'riskLevel',
			label: '风险等级'
		},
		{
			key: 'status',
			label: '状态',
			required: true
		},
		{
			key: 'userName',
			label: '负责人',
			required: true
		},
		{
			key: 'createdAt',
			label: '创建时间',
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
		{ value: 'pending', label: '待处理' },
		{ value: 'processing', label: '处理中' },
		{ value: 'resolved', label: '已解决' }
	];

	const levelOptions: { value: HazardLevel | 'all'; label: string }[] = [
		{ value: 'all', label: '全部等级' },
		{ value: 'critical', label: '极高' },
		{ value: 'high', label: '高' },
		{ value: 'medium', label: '中' },
		{ value: 'low', label: '低' }
	];
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">危化风险处理</h1>
			<p class="text-gray-500">管理和处理所有危化品风险提醒</p>
		</div>
		<button
			onclick={refreshData}
			disabled={loading}
			class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
		>
			<RefreshCw class={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
			刷新
		</button>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			title="总风险数"
			value={riskStats.total}
			icon={AlertTriangle}
			color="orange"
			trend="neutral"
			trendValue="记录"
		/>
		<StatCard
			title="待处理"
			value={riskStats.pending}
			icon={AlertTriangle}
			color="red"
			trend="neutral"
			trendValue="紧急"
		/>
		<StatCard
			title="处理中"
			value={riskStats.processing}
			icon={AlertTriangle}
			color="purple"
			trend="neutral"
			trendValue="进行中"
		/>
		<StatCard
			title="已解决"
			value={riskStats.resolved}
			icon={AlertTriangle}
			color="green"
			trend="up"
			trendValue="已处理"
		/>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">极高风险</p>
			<p class="text-2xl font-bold text-red-600">{riskStats.byLevel.critical}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">高风险</p>
			<p class="text-2xl font-bold text-orange-600">{riskStats.byLevel.high}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">中风险</p>
			<p class="text-2xl font-bold text-yellow-600">{riskStats.byLevel.medium}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">低风险</p>
			<p class="text-2xl font-bold text-green-600">{riskStats.byLevel.low}</p>
		</div>
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
					class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					{#each statusOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
				<select
					bind:value={levelFilter}
					class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					{#each levelOptions as opt}
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
		{:else if filteredRisks.length === 0}
			<div class="p-12 text-center">
				<div class="text-5xl mb-4">✅</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">暂无风险提醒</h3>
				<p class="text-gray-500">
					{statusFilter !== 'all' || levelFilter !== 'all' ? '没有找到匹配的筛选结果' : '所有风险都已处理完成！'}
				</p>
			</div>
		{:else}
			<DataTable
				data={filteredRisks as unknown as Record<string, unknown>[]}
				columns={columns as unknown as Column<Record<string, unknown>>[]}
				emptyMessage="暂无风险提醒"
			>
				{#snippet actions(row)}
					{@const risk = row as unknown as RiskAlertType}
					<div class="flex items-center gap-2">
						<button
							onclick={() => viewDetail(risk)}
							class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
							title="查看详情"
						>
							<Eye class="w-4 h-4" />
						</button>
					</div>
				{/snippet}
			</DataTable>
		{/if}
	</div>
</div>

{#if showDetailModal && selectedRisk}
	{@const risk = selectedRisk}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showDetailModal = false; }}>
		<div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
			<div class="p-6 border-b border-gray-100">
				<div class="flex items-start justify-between">
					<div>
						<h3 class="text-xl font-bold text-gray-900 mb-1">
							风险详情
						</h3>
						<p class="text-sm text-gray-500">
							创建时间：{formatDate(risk.createdAt)}
						</p>
					</div>
					<button
						onclick={() => showDetailModal = false}
						class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
			<div class="p-6 overflow-y-auto max-h-[70vh]">
				<RiskAlert
					risk={risk}
					onProcess={handleProcess}
					onResolve={handleResolve}
				/>
			</div>
		</div>
	</div>
{/if}
