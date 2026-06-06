<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, getUser } from '$lib/api';

	let user = null;
	let stats = {
		total: 0,
		pending: 0,
		approved: 0,
		violations: 0
	};
	let recentApps = [];

	onMount(async () => {
		user = getUser();
		try {
			const res = await api.getApplications({ page_size: 100 });
			stats.total = res.total;
			stats.pending = res.list.filter(a => a.status === 'pending' || a.status === 'manual_review').length;
			stats.approved = res.list.filter(a => a.status === 'approved').length;
			recentApps = res.list.slice(0, 5);

			const vRes = await api.getViolations({ status: 'open' });
			stats.violations = vRes.total;
		} catch (e) {
			console.error(e);
		}
	});
</script>

<div class="dashboard">
	<h2 class="page-title">欢迎回来，{user?.name}</h2>

	<div class="stats-grid">
		<div class="stat-card blue">
			<div class="stat-value">{stats.total}</div>
			<div class="stat-label">施工申请总数</div>
		</div>
		<div class="stat-card yellow">
			<div class="stat-value">{stats.pending}</div>
			<div class="stat-label">待审核</div>
		</div>
		<div class="stat-card green">
			<div class="stat-value">{stats.approved}</div>
			<div class="stat-label">已通过</div>
		</div>
		<div class="stat-card red">
			<div class="stat-value">{stats.violations}</div>
			<div class="stat-label">待处理违规</div>
		</div>
	</div>

	<div class="content-grid">
		<div class="card">
			<div class="card-header">
				<h3>最近申请</h3>
				<button class="link-btn" on:click={() => goto('/applications')}>查看全部 →</button>
			</div>
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>申请编号</th>
							<th>业主</th>
							<th>房号</th>
							<th>状态</th>
						</tr>
					</thead>
					<tbody>
						{#each recentApps as app}
							<tr on:click={() => goto(`/applications/${app.id}`)} class="clickable">
								<td>{app.application_no}</td>
								<td>{app.owner_name}</td>
								<td>{app.building}栋{app.unit}单元{app.room}室</td>
								<td>
									<span class="status-badge" style="background: {statusColor(app.status)}">
										{statusText(app.status)}
									</span>
								</td>
							</tr>
						{/each}
						{#if recentApps.length === 0}
							<tr><td colspan="4" class="empty">暂无数据</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<h3>快捷操作</h3>
			</div>
			<div class="quick-actions">
				{#if user?.role !== 'gate'}
					<button class="action-btn primary" on:click={() => goto('/applications/new')}>
						<span class="icon">➕</span>
						新建施工申请
					</button>
				{/if}
				{#if user?.role === 'engineer' || user?.role === 'admin'}
					<button class="action-btn" on:click={() => goto('/review')}>
						<span class="icon">✅</span>
						审核管理
					</button>
				{/if}
				{#if user?.role === 'gate' || user?.role === 'engineer' || user?.role === 'admin'}
					<button class="action-btn" on:click={() => goto('/gate')}>
						<span class="icon">📱</span>
						门岗核验
					</button>
				{/if}
				<button class="action-btn" on:click={() => goto('/violations')}>
					<span class="icon">⚠️</span>
					违规记录
				</button>
				<button class="action-btn" on:click={() => goto('/notifications')}>
					<span class="icon">🔔</span>
					通知中心
				</button>
			</div>
		</div>
	</div>
</div>

<script context="module">
	const statusText = (s) => ({
		pending: '待审核', manual_review: '待人工复核',
		approved: '已通过', rejected: '已拒绝', returned: '已退回修改'
	}[s] || s);
	const statusColor = (s) => ({
		pending: '#fef3c7', manual_review: '#ede9fe',
		approved: '#d1fae5', rejected: '#fee2e2', returned: '#ffedd5'
	}[s] || '#e5e7eb');
</script>

<style>
	.dashboard { padding: 0; }
	.page-title {
		font-size: 24px;
		margin-bottom: 24px;
		color: #1f2937;
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}
	.stat-card {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		border-left: 4px solid;
	}
	.stat-card.blue { border-left-color: #3b82f6; }
	.stat-card.yellow { border-left-color: #f59e0b; }
	.stat-card.green { border-left-color: #10b981; }
	.stat-card.red { border-left-color: #ef4444; }
	.stat-value {
		font-size: 32px;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 4px;
	}
	.stat-label {
		font-size: 14px;
		color: #6b7280;
	}
	.content-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 20px;
	}
	.card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		overflow: hidden;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid #e5e7eb;
	}
	.card-header h3 {
		font-size: 16px;
		color: #1f2937;
	}
	.link-btn {
		background: none;
		border: none;
		color: #3b82f6;
		cursor: pointer;
		font-size: 14px;
	}
	.table-wrapper { padding: 0 20px 20px; }
	.data-table {
		width: 100%;
		border-collapse: collapse;
	}
	.data-table th {
		text-align: left;
		padding: 12px 8px;
		font-size: 12px;
		color: #6b7280;
		font-weight: 500;
		border-bottom: 1px solid #e5e7eb;
	}
	.data-table td {
		padding: 12px 8px;
		font-size: 14px;
		border-bottom: 1px solid #f3f4f6;
	}
	.data-table tr.clickable { cursor: pointer; }
	.data-table tr.clickable:hover { background: #f9fafb; }
	.status-badge {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		color: #1f2937;
	}
	.empty {
		text-align: center;
		color: #9ca3af;
		padding: 40px 0 !important;
	}
	.quick-actions {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.action-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		border: 1px solid #e5e7eb;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		color: #374151;
		text-align: left;
		transition: all 0.2s;
	}
	.action-btn:hover {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	.action-btn.primary {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}
	.action-btn.primary:hover {
		background: #2563eb;
	}
	.icon { font-size: 18px; }
</style>
