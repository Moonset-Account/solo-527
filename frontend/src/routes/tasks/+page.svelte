<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$api/client';
	import { taskFilter } from '$stores/filter';
	import { auth } from '$stores/auth';
	import { getStatusLabel, getStatusClass, formatDate } from '$utils/helpers';

	let tasks = [];
	let total = 0;
	let loading = false;
	let sites = [];
	let filter = $taskFilter;
	let showFilters = true;

	$: isDispatcher = $auth.user?.role === 'dispatcher' || $auth.user?.role === 'admin';
	$: isNurse = $auth.user?.role === 'nurse';

	$: {
		taskFilter.set(filter);
	}

	async function loadTasks() {
		loading = true;
		try {
			const params = {};
			if (filter.status) params.status = filter.status;
			if (filter.site_id) params.site_id = filter.site_id;
			if (filter.box_number) params.box_number = filter.box_number;
			if (filter.start_date) params.start_date = filter.start_date;
			if (filter.end_date) params.end_date = filter.end_date;
			params.page = filter.page;
			params.pageSize = filter.pageSize;

			const result = await api.getTasks(params);
			tasks = result.data;
			total = result.total;
		} catch (e) {
			alert(e.message);
		} finally {
			loading = false;
		}
	}

	async function loadSites() {
		try {
			sites = await api.getSites();
		} catch (e) {}
	}

	function handleFilter() {
		filter.page = 1;
		taskFilter.set(filter);
		loadTasks();
	}

	function resetFilter() {
		filter = {
			status: '',
			site_id: '',
			box_number: '',
			start_date: '',
			end_date: '',
			page: 1,
			pageSize: 20
		};
		taskFilter.reset();
		loadTasks();
	}

	function changePage(page) {
		filter.page = page;
		taskFilter.set(filter);
		loadTasks();
	}

	function goToDetail(id) {
		goto(`/tasks/${id}`);
	}

	async function exportCSV() {
		try {
			const params = {};
			if (filter.status) params.status = filter.status;
			if (filter.site_id) params.site_id = filter.site_id;
			if (filter.box_number) params.box_number = filter.box_number;
			if (filter.start_date) params.start_date = filter.start_date;
			if (filter.end_date) params.end_date = filter.end_date;
			await api.exportTasks(params);
		} catch (e) {
			alert(e.message);
		}
	}

	onMount(() => {
		filter = $taskFilter;
		loadSites();
		loadTasks();
	});

	$: totalPages = Math.ceil(total / filter.pageSize);
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold text-gray-900">任务列表</h1>
		<div class="flex space-x-3">
			<button
				on:click={exportCSV}
				class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
			>
				📊 导出报表
			</button>
			{#if isDispatcher}
				<button
					on:click={() => goto('/tasks/new')}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
				>
					+ 创建任务
				</button>
			{/if}
		</div>
	</div>

	<div class="bg-white rounded-xl shadow-sm border">
		<button
			on:click={() => showFilters = !showFilters}
			class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
		>
			<span class="font-medium text-gray-700">筛选条件</span>
			<span class="text-gray-400">{showFilters ? '收起' : '展开'}</span>
		</button>

		{#if showFilters}
			<div class="px-6 pb-6 border-t">
				<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
						<select
							bind:value={filter.status}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						>
							<option value="">全部</option>
							<option value="pending">待处理</option>
							<option value="in_transit">配送中</option>
							<option value="arrived">已到达</option>
							<option value="signed">已签收</option>
							<option value="returned">已退回</option>
							<option value="exception">异常</option>
							<option value="reviewing">复核中</option>
							<option value="completed">已完成</option>
						</select>
					</div>

					{#if !isNurse}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">站点</label>
							<select
								bind:value={filter.site_id}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							>
								<option value="">全部</option>
								{#each sites as s}
									<option value={s.id}>{s.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">箱号</label>
						<input
							type="text"
							bind:value={filter.box_number}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							placeholder="搜索箱号"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
						<input
							type="date"
							bind:value={filter.start_date}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
						<input
							type="date"
							bind:value={filter.end_date}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex items-end space-x-2">
						<button
							on:click={handleFilter}
							class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
						>
							查询
						</button>
						<button
							on:click={resetFilter}
							class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
						>
							重置
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
		{#if loading}
			<div class="p-12 text-center text-gray-500">加载中...</div>
		{:else if tasks.length === 0}
			<div class="p-12 text-center text-gray-500">暂无任务数据</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">箱号</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">路线</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">站点</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">调度员</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">签收护士</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each tasks as task}
							<tr class="hover:bg-gray-50 cursor-pointer" on:click={() => goToDetail(task.id)}>
								<td class="px-6 py-4">
									<span class="font-medium text-blue-600">{task.box_number}</span>
								</td>
								<td class="px-6 py-4 text-sm text-gray-900">{task.route_name}</td>
								<td class="px-6 py-4 text-sm text-gray-900">{task.site_name}</td>
								<td class="px-6 py-4">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusClass(task.status)}">
										{getStatusLabel(task.status)}
									</span>
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">{task.dispatcher_name}</td>
								<td class="px-6 py-4 text-sm text-gray-500">{task.nurse_name || '-'}</td>
								<td class="px-6 py-4 text-sm text-gray-500">{formatDate(task.created_at)}</td>
								<td class="px-6 py-4">
									<button
										on:click|stopPropagation={() => goToDetail(task.id)}
										class="text-blue-600 hover:text-blue-800 text-sm"
									>
										查看详情
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if totalPages > 1}
				<div class="px-6 py-4 border-t flex justify-between items-center">
					<span class="text-sm text-gray-500">共 {total} 条，第 {filter.page} / {totalPages} 页</span>
					<div class="flex space-x-2">
						<button
							on:click={() => changePage(filter.page - 1)}
							disabled={filter.page <= 1}
							class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							上一页
						</button>
						{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + Math.max(1, filter.page - 2)) as page}
							{#if page <= totalPages}
								<button
									on:click={() => changePage(page)}
									class="px-3 py-1 border rounded {page === filter.page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}"
								>
									{page}
								</button>
							{/if}
						{/each}
						<button
							on:click={() => changePage(filter.page + 1)}
							disabled={filter.page >= totalPages}
							class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							下一页
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
