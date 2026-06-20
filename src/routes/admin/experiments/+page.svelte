<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentUser } from '$stores/user';
	import DataTable from '$components/DataTable.svelte';
	import StatusBadge from '$components/StatusBadge.svelte';
	import StatCard from '$components/StatCard.svelte';
	import { Archive, Trash2, Eye, Search } from 'lucide-svelte';
	import { formatDate } from '$utils/format';
	import { mockExperiments, mockUsers } from '$server/mockData';
	import type { Experiment, Column } from '$types';

	let experiments = $state<Experiment[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let selectedExperiment = $state<Experiment | null>(null);
	let showDetailModal = $state(false);

	let user = $derived(get(currentUser));
	let isAdmin = $derived(user?.role === 'admin');

	let filteredExperiments = $derived(experiments.filter((exp) => {
		if (!searchQuery) return true;
		const lower = searchQuery.toLowerCase();
		return (
			exp.title.toLowerCase().includes(lower) ||
			exp.data.toLowerCase().includes(lower)
		);
	}));

	let stats = $derived({
		total: experiments.length,
		thisMonth: experiments.filter((e) => {
			const now = new Date();
			const expDate = new Date(e.archivedAt);
			return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
		}).length
	});

	onMount(async () => {
		try {
			experiments = [...mockExperiments];
		} catch (e) {
			console.error('Failed to load experiments:', e);
		} finally {
			loading = false;
		}
	});

	function getUserName(userId: string): string {
		const u = mockUsers.find((u) => u.id === userId);
		return u?.name || '未知用户';
	}

	function viewDetail(exp: Experiment) {
		selectedExperiment = exp;
		showDetailModal = true;
	}

	async function handleDelete(id: string) {
		if (!confirm('确定要删除这条实验数据吗？此操作不可恢复。')) return;

		try {
			const idx = experiments.findIndex((e) => e.id === id);
			if (idx >= 0) {
				experiments.splice(idx, 1);
				experiments = [...experiments];
			}
		} catch (e) {
			console.error('Failed to delete experiment:', e);
			alert('删除失败，请重试');
		}
	}

	const columns: Column<Experiment>[] = [
		{
			key: 'title',
			label: '实验标题',
			className: 'font-medium text-gray-900'
		},
		{
			key: 'userId',
			label: '负责人',
			required: true,
			render: (item) => getUserName(item.userId)
		},
		{
			key: 'archivedAt',
			label: '归档时间',
			render: (item) => formatDate(item.archivedAt)
		},
		{
			key: 'actions',
			label: '操作',
			render: () => ({ type: 'actions' as const })
		}
	];
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-2xl font-bold text-gray-900 mb-2">实验数据管理</h1>
		<p class="text-gray-500">管理所有已归档的实验数据</p>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<StatCard
			title="总归档数"
			value={stats.total}
			icon={Archive}
			color="purple"
			trend="up"
			trendValue="完整记录"
		/>
		<StatCard
			title="本月归档"
			value={stats.thisMonth}
			icon={Archive}
			color="blue"
			trend="up"
			trendValue="新增"
		/>
		<div class="card p-5 flex items-center gap-4">
			<div class="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
				<Search class="w-6 h-6" />
			</div>
			<div class="flex-1">
				<p class="text-sm text-gray-500 mb-1">搜索</p>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="搜索实验数据..."
					class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				/>
			</div>
		</div>
	</div>

	<div class="card">
		{#if loading}
			<div class="p-12 text-center">
				<div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
				<p class="text-gray-500">加载中...</p>
			</div>
		{:else if filteredExperiments.length === 0}
			<div class="p-12 text-center">
				<div class="text-5xl mb-4">📁</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">暂无实验数据</h3>
				<p class="text-gray-500">
					{searchQuery ? '没有找到匹配的搜索结果' : '还没有归档任何实验数据'}
				</p>
			</div>
		{:else}
			<DataTable
				data={filteredExperiments}
				{columns}
				emptyText="暂无实验数据"
				actions={({ item }: { item: Experiment }) => (
					<div class="flex items-center gap-2">
						<button
							onclick={() => viewDetail(item)}
							class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
							title="查看详情"
						>
							<Eye class="w-4 h-4" />
						</button>
						{#if isAdmin}
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

{#if showDetailModal && selectedExperiment}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => showDetailModal = false}>
		<div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scale-in">
			<div class="p-6 border-b border-gray-100">
				<div class="flex items-start justify-between">
					<div>
						<h3 class="text-xl font-bold text-gray-900 mb-1">
							{selectedExperiment.title}
						</h3>
						<p class="text-sm text-gray-500">
							负责人：{getUserName(selectedExperiment.userId)} · 归档时间：{formatDate(selectedExperiment.archivedAt)}
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
				<div class="bg-gray-50 rounded-xl p-4">
					<pre class="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
{selectedExperiment.data}
					</pre>
				</div>
			</div>
			<div class="p-4 border-t border-gray-100 flex justify-end gap-3">
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
