<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api, statusText, statusColor } from '$lib/api';

	let loading = true;
	let applications = [];
	let total = 0;
	let pageNum = 1;
	let pageSize = 10;

	let filters = {
		status: '',
		building: '',
		keyword: ''
	};

	let filterParams = {};

	$: urlParams = new URLSearchParams($page.url.search);

	onMount(() => {
		restoreFilters();
		loadData();
	});

	function restoreFilters() {
		const saved = sessionStorage.getItem('appFilters');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				filters = parsed.filters;
				pageNum = parsed.page || 1;
			} catch (e) {}
		}
	}

	function saveFilters() {
		sessionStorage.setItem('appFilters', JSON.stringify({
			filters,
			page: pageNum
		}));
	}

	async function loadData() {
		loading = true;
		try {
			const params = {
				page: pageNum,
				page_size: pageSize
			};
			if (filters.status) params.status = filters.status;
			if (filters.building) params.building = filters.building;
			if (filters.keyword) params.keyword = filters.keyword;
			filterParams = params;

			const res = await api.getApplications(params);
			applications = res.list;
			total = res.total;
			saveFilters();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		pageNum = 1;
		loadData();
	}

	function clearFilters() {
		filters = { status: '', building: '', keyword: '' };
		pageNum = 1;
		loadData();
	}

	function goToDetail(id) {
		saveFilters();
		goto(`/applications/${id}`);
	}

	function changePage(p) {
		pageNum = p;
		loadData();
	}

	$: totalPages = Math.ceil(total / pageSize);
</script>

<div class="page">
	<div class="page-header">
		<h2>施工申请列表</h2>
		<button class="btn-primary" on:click={() => goto('/applications/new')}>+ 新建申请</button>
	</div>

	<div class="filter-card">
		<div class="filter-row">
			<div class="filter-item">
				<label>状态</label>
				<select bind:value={filters.status} on:change={handleSearch}>
					<option value="">全部</option>
					<option value="pending">待审核</option>
					<option value="manual_review">待人工复核</option>
					<option value="approved">已通过</option>
					<option value="returned">已退回修改</option>
					<option value="rejected">已拒绝</option>
				</select>
			</div>
			<div class="filter-item">
				<label>楼栋</label>
				<input type="text" bind:value={filters.building} placeholder="如：1" />
			</div>
			<div class="filter-item">
				<label>关键词</label>
				<input type="text" bind:value={filters.keyword} placeholder="申请编号/业主/施工队" />
			</div>
			<div class="filter-actions">
				<button class="btn-secondary" on:click={handleSearch}>搜索</button>
				<button class="btn-outline" on:click={clearFilters}>重置</button>
			</div>
		</div>
	</div>

	<div class="card">
		{#if loading}
			<div class="loading">加载中...</div>
		{:else}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>申请编号</th>
							<th>业主</th>
							<th>房号</th>
							<th>施工队</th>
							<th>施工日期</th>
							<th>噪音作业</th>
							<th>状态</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each applications as app}
							<tr>
								<td>{app.application_no}</td>
								<td>{app.owner_name}</td>
								<td>{app.building}栋{app.unit}单元{app.room}室</td>
								<td>{app.team_name || '-'}</td>
								<td>{app.start_date} ~ {app.end_date}</td>
								<td>{app.has_noise_work ? '是' : '否'}</td>
								<td>
									<span class="status-badge" style="background: {statusColor[app.status]}20; color: {statusColor[app.status]}">
										{statusText[app.status]}
									</span>
								</td>
								<td>
									<button class="link-btn" on:click={() => goToDetail(app.id)}>查看</button>
								</td>
							</tr>
						{/each}
						{#if applications.length === 0}
							<tr><td colspan="8" class="empty">暂无数据</td></tr>
						{/if}
					</tbody>
				</table>
			</div>

			{#if total > 0}
				<div class="pagination">
					<span class="total">共 {total} 条</span>
					<div class="pages">
						<button disabled={pageNum <= 1} on:click={() => changePage(pageNum - 1)}>上一页</button>
						{#each Array.from({length: totalPages}, (_, i) => i + 1) as p}
							{#if Math.abs(p - pageNum) <= 2 || p === 1 || p === totalPages}
								<button class="{p === pageNum ? 'active' : ''}" on:click={() => changePage(p)}>{p}</button>
							{/if}
						{/each}
						<button disabled={pageNum >= totalPages} on:click={() => changePage(pageNum + 1)}>下一页</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.page { padding: 0; }
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}
	.page-header h2 { font-size: 22px; color: #1f2937; }
	.filter-card {
		background: white;
		padding: 16px 20px;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		margin-bottom: 16px;
	}
	.filter-row {
		display: flex;
		gap: 16px;
		align-items: flex-end;
		flex-wrap: wrap;
	}
	.filter-item { display: flex; flex-direction: column; gap: 6px; }
	.filter-item label { font-size: 13px; color: #6b7280; }
	.filter-item input, .filter-item select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		min-width: 140px;
		outline: none;
	}
	.filter-actions { display: flex; gap: 8px; }
	.card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		overflow: hidden;
	}
	.loading { text-align: center; padding: 60px 0; color: #9ca3af; }
	.table-wrapper { overflow-x: auto; }
	.data-table { width: 100%; border-collapse: collapse; }
	.data-table th {
		text-align: left;
		padding: 14px 16px;
		font-size: 13px;
		color: #6b7280;
		font-weight: 500;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}
	.data-table td {
		padding: 14px 16px;
		font-size: 14px;
		border-bottom: 1px solid #f3f4f6;
	}
	.status-badge {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}
	.link-btn {
		background: none;
		border: none;
		color: #3b82f6;
		cursor: pointer;
		font-size: 14px;
	}
	.empty { text-align: center; color: #9ca3af; padding: 40px 0 !important; }
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-top: 1px solid #e5e7eb;
	}
	.total { font-size: 14px; color: #6b7280; }
	.pages { display: flex; gap: 4px; }
	.pages button {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}
	.pages button:hover:not(:disabled):not(.active) { border-color: #3b82f6; color: #3b82f6; }
	.pages button.active { background: #3b82f6; color: white; border-color: #3b82f6; }
	.pages button:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-primary {
		padding: 8px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.btn-secondary {
		padding: 8px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.btn-outline {
		padding: 8px 16px;
		background: white;
		color: #6b7280;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
</style>
