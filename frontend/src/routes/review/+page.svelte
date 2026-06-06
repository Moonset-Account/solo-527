<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, statusText, statusColor } from '$lib/api';

	let loading = true;
	let applications = [];
	let tab = 'pending';

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const params = { page_size: 50 };
			if (tab === 'pending') {
				params.status = 'pending';
			} else if (tab === 'manual') {
				params.status = 'manual_review';
			}
			const res = await api.getApplications(params);
			applications = res.list;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	$: if (tab) loadData();
</script>

<div class="page">
	<div class="page-header">
		<h2>审核管理</h2>
	</div>

	<div class="tabs">
		<button class="tab {tab === 'pending' ? 'active' : ''}" on:click={() => tab = 'pending'}">
			待审核
		</button>
		<button class="tab {tab === 'manual' ? 'active' : ''}" on:click={() => tab = 'manual'}">
			待人工复核
		</button>
		<button class="tab {tab === 'all' ? 'active' : ''}" on:click={() => tab = 'all'}">
			全部
		</button>
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
									<button class="link-btn" on:click={() => goto(`/applications/${app.id}`)}>审核</button>
								</td>
							</tr>
						{/each}
						{#if applications.length === 0}
							<tr><td colspan="8" class="empty">暂无数据</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.page { padding: 0; }
	.page-header h2 { font-size: 22px; margin-bottom: 20px; color: #1f2937; }
	.tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 16px;
		background: white;
		padding: 4px;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		display: inline-flex;
	}
	.tab {
		padding: 8px 20px;
		border: none;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		color: #6b7280;
	}
	.tab:hover { color: #3b82f6; }
	.tab.active {
		background: #3b82f6;
		color: white;
	}
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
</style>
