<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentUser } from '$stores/user';
	import DataTable from '$components/DataTable.svelte';
	import StatusBadge from '$components/StatusBadge.svelte';
	import StatCard from '$components/StatCard.svelte';
	import { Shield, Download, Filter, RefreshCw } from 'lucide-svelte';
	import { formatDate } from '$utils/format';
	import { mockCompliance, getComplianceStats } from '$server/mockData';
	import type { ComplianceRecord, Column, Status, ComplianceType } from '$types';

	let records = $state<ComplianceRecord[]>([]);
	let loading = $state(true);
	let statusFilter = $state<Status | 'all'>('all');
	let typeFilter = $state<ComplianceType | 'all'>('all');
	let complianceStats = $state(getComplianceStats());

	let user = $derived(get(currentUser));

	let filteredRecords = $derived(records.filter((r) => {
		if (statusFilter !== 'all' && r.status !== statusFilter) return false;
		if (typeFilter !== 'all' && r.type !== typeFilter) return false;
		return true;
	}));

	onMount(async () => {
		try {
			records = [...mockCompliance];
		} catch (e) {
			console.error('Failed to load compliance records:', e);
		} finally {
			loading = false;
		}
	});

	async function refreshData() {
		loading = true;
		try {
			records = [...mockCompliance];
			complianceStats = getComplianceStats();
		} catch (e) {
			console.error('Failed to refresh data:', e);
		} finally {
			loading = false;
		}
	}

	async function handleExport() {
		try {
			const typeMap: Record<ComplianceType, string> = {
				requisition: '领用申请',
				experiment: '实验数据',
				todo: '待办事项',
				risk: '风险处理'
			};

			const statusMap: Record<Status, string> = {
				pending: '待处理',
				approved: '已批准',
				rejected: '已拒绝',
				completed: '已完成',
				processing: '处理中',
				resolved: '已解决',
				failed: '已失败'
			};

			const headers = [
				'ID',
				'类型',
				'状态',
				'操作人',
				'详情',
				'创建时间',
				'处理时间'
			];

			const rows = filteredRecords.map((record) => [
				record.id,
				typeMap[record.type] || record.type,
				statusMap[record.status] || record.status,
				record.operator,
				`"${record.details.replace(/"/g, '""')}"`,
				formatDate(record.createdAt),
				record.processedAt ? formatDate(record.processedAt) : ''
			]);

			const csvContent =
				'\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `安全合规记录_${formatDate(new Date()).replace(/[/:]/g, '-')}.csv`;
			link.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error('Failed to export:', e);
			alert('导出失败，请重试');
		}
	}

	const columns: Column<ComplianceRecord>[] = [
		{
			key: 'type',
			label: '类型'
		},
		{
			key: 'status',
			label: '状态',
			required: true
		},
		{
			key: 'operator',
			label: '负责人',
			required: true,
			className: 'font-medium text-gray-900'
		},
		{
			key: 'details',
			label: '详情',
			className: 'max-w-xs truncate'
		},
		{
			key: 'createdAt',
			label: '创建时间',
			render: (item) => formatDate(item.createdAt)
		},
		{
			key: 'processedAt',
			label: '处理时间',
			render: (item) => item.processedAt ? formatDate(item.processedAt) : '-'
		}
	];

	const statusOptions: { value: Status | 'all'; label: string }[] = [
		{ value: 'all', label: '全部状态' },
		{ value: 'pending', label: '待处理' },
		{ value: 'processing', label: '处理中' },
		{ value: 'completed', label: '已完成' },
		{ value: 'resolved', label: '已解决' },
		{ value: 'approved', label: '已批准' },
		{ value: 'rejected', label: '已拒绝' }
	];

	const typeOptions: { value: ComplianceType | 'all'; label: string }[] = [
		{ value: 'all', label: '全部类型' },
		{ value: 'requisition', label: '领用申请' },
		{ value: 'experiment', label: '实验数据' },
		{ value: 'todo', label: '待办事项' },
		{ value: 'risk', label: '风险处理' }
	];
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">安全合规看板</h1>
			<p class="text-gray-500">监控和管理所有安全合规记录</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				on:click={refreshData}
				disabled={loading}
				class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
				刷新
			</button>
			<button
				on:click={handleExport}
				class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
			>
				<Download class="w-4 h-4" />
				导出 CSV
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			title="总记录数"
			value={complianceStats.total}
			icon={Shield}
			color="green"
			trend="up"
			trendValue="完整追踪"
		/>
		<StatCard
			title="待处理"
			value={complianceStats.pending}
			icon={Shield}
			color="orange"
			trend="neutral"
			trendValue="需关注"
		/>
		<StatCard
			title="已完成"
			value={complianceStats.completed}
			icon={Shield}
			color="green"
			trend="up"
			trendValue="已处理"
		/>
		<StatCard
			title="风险处理"
			value={complianceStats.byType.risk}
			icon={Shield}
			color="red"
			trend="neutral"
			trendValue="记录"
		/>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">领用申请</p>
			<p class="text-2xl font-bold text-primary-600">{complianceStats.byType.requisition}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">实验数据</p>
			<p class="text-2xl font-bold text-purple-600">{complianceStats.byType.experiment}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">待办事项</p>
			<p class="text-2xl font-bold text-indigo-600">{complianceStats.byType.todo}</p>
		</div>
		<div class="card p-4">
			<p class="text-xs text-gray-500 mb-1">风险处理</p>
			<p class="text-2xl font-bold text-orange-600">{complianceStats.byType.risk}</p>
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
					bind:value={typeFilter}
					class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					{#each typeOptions as opt}
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
		{:else if filteredRecords.length === 0}
			<div class="p-12 text-center">
				<div class="text-5xl mb-4">🛡️</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">暂无合规记录</h3>
				<p class="text-gray-500">
					{statusFilter !== 'all' || typeFilter !== 'all' ? '没有找到匹配的筛选结果' : '还没有任何合规记录'}
				</p>
			</div>
		{:else}
			<DataTable
				data={filteredRecords}
				{columns}
				emptyText="暂无合规记录"
			/>
		{/if}
	</div>
</div>
