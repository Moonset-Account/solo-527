<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentUser } from '$stores/user';
	import DataTable from '$components/DataTable.svelte';
	import StatCard from '$components/StatCard.svelte';
	import { FlaskConical, Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-svelte';
	import { formatDate } from '$utils/format';
	import { mockReagents } from '$server/mockData';
	import type { Reagent, Column, HazardLevel } from '$types';

	let reagents = $state<Reagent[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let categoryFilter = $state<string>('all');
	let hazardFilter = $state<HazardLevel | 'all'>('all');

	let user = $derived(get(currentUser));
	let isAdmin = $derived(user?.role === 'admin');

	let filteredReagents = $derived(reagents.filter((r) => {
		if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
		if (hazardFilter !== 'all' && r.hazardLevel !== hazardFilter) return false;
		if (searchQuery) {
			const lower = searchQuery.toLowerCase();
			return (
				r.name.toLowerCase().includes(lower) ||
				r.casNumber.toLowerCase().includes(lower)
			);
		}
		return true;
	}));

	let stats = $derived({
		total: reagents.length,
		hazardous: reagents.filter((r) => r.category === 'hazardous').length,
		lowStock: reagents.filter((r) => r.stock < 100).length,
		highRisk: reagents.filter((r) => r.hazardLevel === 'critical' || r.hazardLevel === 'high').length
	});

	onMount(async () => {
		try {
			reagents = [...mockReagents];
		} catch (e) {
			console.error('Failed to load reagents:', e);
		} finally {
			loading = false;
		}
	});

	async function handleDelete(id: string) {
		if (!confirm('确定要删除这个试剂吗？')) return;

		try {
			const idx = reagents.findIndex((r) => r.id === id);
			if (idx >= 0) {
				reagents.splice(idx, 1);
				reagents = [...reagents];
			}
		} catch (e) {
			console.error('Failed to delete reagent:', e);
			alert('删除失败，请重试');
		}
	}

	const columns: Column<Reagent>[] = [
		{
			key: 'name',
			label: '试剂名称',
			className: 'font-medium text-gray-900'
		},
		{
			key: 'casNumber',
			label: 'CAS号',
			className: 'font-mono text-xs text-gray-500'
		},
		{
			key: 'category',
			label: '分类'
		},
		{
			key: 'hazardLevel',
			label: '风险等级'
		},
		{
			key: 'stock',
			label: '库存'
		},
		{
			key: 'actions',
			label: '操作',
			render: () => ({ type: 'actions' as const })
		}
	];

	const categoryOptions = [
		{ value: 'all', label: '全部分类' },
		{ value: 'normal', label: '普通' },
		{ value: 'hazardous', label: '危化' },
		{ value: 'controlled', label: '管制' }
	];

	const hazardOptions: { value: HazardLevel | 'all'; label: string }[] = [
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
			<h1 class="text-2xl font-bold text-gray-900 mb-2">试剂库存管理</h1>
			<p class="text-gray-500">管理所有试剂的库存信息</p>
		</div>
		{#if isAdmin}
			<button class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
				<Plus class="w-4 h-4" />
				新增试剂
			</button>
		{/if}
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			title="试剂总数"
			value={stats.total}
			icon={FlaskConical}
			color="blue"
			trend="neutral"
			trendValue="品类"
		/>
		<StatCard
			title="危化品"
			value={stats.hazardous}
			icon={AlertTriangle}
			color="orange"
			trend="neutral"
			trendValue="需重点管理"
		/>
		<StatCard
			title="库存预警"
			value={stats.lowStock}
			icon={AlertTriangle}
			color="red"
			trend="neutral"
			trendValue="低于100"
		/>
		<StatCard
			title="高风险"
			value={stats.highRisk}
			icon={AlertTriangle}
			color="red"
			trend="neutral"
			trendValue="需关注"
		/>
	</div>

	<div class="card">
		<div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
			<div class="flex-1 relative">
				<Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="搜索试剂名称或CAS号..."
					class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				/>
			</div>
			<div class="flex flex-wrap gap-2">
				<select
					bind:value={categoryFilter}
					class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					{#each categoryOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
				<select
					bind:value={hazardFilter}
					class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					{#each hazardOptions as opt}
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
		{:else if filteredReagents.length === 0}
			<div class="p-12 text-center">
				<div class="text-5xl mb-4">🧪</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">暂无试剂</h3>
				<p class="text-gray-500">
					{searchQuery || categoryFilter !== 'all' || hazardFilter !== 'all' ? '没有找到匹配的搜索结果' : '还没有添加任何试剂'}
				</p>
			</div>
		{:else}
			<DataTable
				data={filteredReagents}
				{columns}
				emptyText="暂无试剂"
				actions={({ item }: { item: Reagent }) => (
					<div class="flex items-center gap-2">
						{#if isAdmin}
							<button
								class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
								title="编辑"
							>
								<Edit2 class="w-4 h-4" />
							</button>
							<button
								onclick={() => handleDelete(item.id)}
								class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								title="删除"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						{/if}
					</div>
				)}
			/>
		{/if}
	</div>
</div>
