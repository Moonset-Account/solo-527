<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api';

	let loading = true;
	let logs = [];
	let total = 0;
	let pageNum = 1;
	let pageSize = 20;

	let filters = {
		module: '',
		keyword: '',
		start_date: '',
		end_date: ''
	};

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const params = {
				page: pageNum,
				page_size: pageSize
			};
			if (filters.module) params.module = filters.module;
			if (filters.keyword) params.keyword = filters.keyword;
			if (filters.start_date) params.start_date = filters.start_date;
			if (filters.end_date) params.end_date = filters.end_date;

			const res = await api.getAuditLogs(params);
			logs = res.list;
			total = res.total;
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
		filters = { module: '', keyword: '', start_date: '', end_date: '' };
		pageNum = 1;
		loadData();
	}

	function getModuleText(m) {
		return {
			auth: '认证',
			application: '施工申请',
			violation: '违规记录',
			gate: '门岗核验',
			notification: '通知'
		}[m] || m;
	}

	function getActionText(a) {
		return {
			login: '登录',
			create: '创建',
			update: '更新',
			review: '审核',
			verify: '核验',
			handle: '处理'
		}[a] || a;
	}

	$: totalPages = Math.ceil(total / pageSize);
</script>

<div class="page">
	<div class="page-header">
		<h2>审计查询</h2>
	</div>

	<div class="filter-card">
		<div class="filter-row">
			<div class="filter-item">
				<label>模块</label>
				<select bind:value={filters.module}>
					<option value="">全部</option>
					<option value="auth">认证</option>
					<option value="application">施工申请</option>
					<option value="violation">违规记录</option>
					<option value="gate">门岗核验</option>
				</select>
			</div>
			<div class="filter-item">
				<label>关键词</label>
				<input type="text" bind:value={filters.keyword} placeholder="操作人/详情" />
			</div>
			<div class="filter-item">
				<label>开始日期</label>
				<input type="date" bind:value={filters.start_date} />
			</div>
			<div class="filter-item">
				<label>结束日期</label>
				<input type="date" bind:value={filters.end_date} />
			</div>
			<div class="filter-actions">
				<button class="btn-secondary" on:click={handleSearch}>查询</button>
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
							<th>时间</th>
							<th>操作人</th>
							<th>模块</th>
							<th>操作</th>
							<th>详情</th>
							<th>IP地址</th>
						</tr>
					</thead>
					<tbody>
						{#each logs as log}
							<tr>
								<td>{new Date(log.created_at).toLocaleString('zh-CN')}</td>
								<td>{log.user_name || '-'}</td>
								<td>
									<span class="module-tag">{getModuleText(log.module)}</span>
								</td>
								<td>{getActionText(log.action)}</td>
								<td class="detail">{log.detail || '-'}</td>
								<td>{log.ip_address || '-'}</td>
							</tr>
						{/each}
						{#if logs.length === 0}
							<tr><td colspan="6" class="empty">暂无数据</td></tr>
						{/if}
					</tbody>
				</table>
			</div>

			{#if total > 0}
				<div class="pagination">
					<span class="total">共 {total} 条记录</span>
					<div class="pages">
						<button disabled={pageNum <= 1} on:click={() => { pageNum--; loadData(); }}>上一页</button>
						{#each Array.from({length: Math.min(totalPages, 5)}, (_, i) => i + 1) as p}
							<button class="{p === pageNum ? 'active' : ''}" on:click={() => { pageNum = p; loadData(); }}>{p}</button>
						{/each}
						<button disabled={pageNum >= totalPages} on:click={() => { pageNum++; loadData(); }}>下一页</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.page { padding: 0; }
	.page-header h2 { font-size: 22px; margin-bottom: 20px; color: #1f2937; }
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
	.data-table td.detail { max-width: 300px; }
	.module-tag {
		display: inline-block;
		padding: 3px 8px;
		background: #eff6ff;
		color: #2563eb;
		border-radius: 4px;
		font-size: 12px;
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
