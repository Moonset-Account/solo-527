<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, type QueueItem, type Prescription } from '$lib/api';

	let user: any = null;
	let queueData: any = null;
	let prescriptions: Prescription[] = [];
	let loading = true;

	onMount(async () => {
		const savedUser = localStorage.getItem('user');
		if (!savedUser) {
			goto('/login');
			return;
		}
		user = JSON.parse(savedUser);

		try {
			[queueData] = await Promise.all([
				api.getQueueStatus()
			]);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	});

	const statusColors: Record<string, string> = {
		pending: '#faad14',
		queued: '#1890ff',
		called: '#722ed1',
		dispensed: '#52c41a',
		cancelled: '#ff4d4f',
		expired: '#8c8c8c',
		lack_drug: '#fa8c16'
	};

	const statusLabels: Record<string, string> = {
		pending: '待处理',
		queued: '排队中',
		called: '已叫号',
		dispensed: '已发药',
		cancelled: '已取消',
		expired: '已过期',
		lack_drug: '缺药'
	};
</script>

<div class="dashboard">
	<h2 class="page-title">📊 系统概览</h2>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="stats-cards">
			<div class="stat-card">
				<div class="stat-icon waiting">⏳</div>
				<div class="stat-content">
					<div class="stat-value">{queueData?.waiting_count || 0}</div>
					<div class="stat-label">等待叫号</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon called">📢</div>
				<div class="stat-content">
					<div class="stat-value">{queueData?.called_count || 0}</div>
					<div class="stat-label">已叫号</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon completed">✅</div>
				<div class="stat-content">
					<div class="stat-value">{queueData?.completed_count || 0}</div>
					<div class="stat-label">已完成</div>
				</div>
			</div>
		</div>

		<div class="content-grid">
			<div class="card">
				<h3>📋 当前排队列表</h3>
				{#if queueData?.queue && queueData.queue.length > 0}
					<table class="data-table">
						<thead>
							<tr>
								<th>排队号</th>
								<th>处方号</th>
								<th>患者姓名</th>
								<th>状态</th>
								<th>窗口</th>
							</tr>
						</thead>
						<tbody>
							{#each queueData.queue.slice(0, 10) as item}
								<tr>
									<td><strong>#{item.queue_no}</strong></td>
									<td>{item.prescription_no}</td>
									<td>{item.patient_name}</td>
									<td>
										<span class="status-badge" style="background: {item.status === 'called' ? '#f6ffed' : '#e6f7ff'}; color: {item.status === 'called' ? '#52c41a' : '#1890ff'}">
											{item.status === 'called' ? '叫号中' : '等待中'}
										</span>
									</td>
									<td>{item.window_no || '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="empty">暂无排队数据</p>
				{/if}
			</div>

			<div class="card">
				<h3>🔗 快捷入口</h3>
				<div class="quick-links">
					<a href="/patient" class="quick-link">
						<span class="link-icon">🔍</span>
						<span>患者查询</span>
					</a>
					{#if user?.role === 'pharmacist' || user?.role === 'admin'}
						<a href="/pharmacist" class="quick-link">
							<span class="link-icon">📝</span>
							<span>处方管理</span>
						</a>
					{/if}
					{#if user?.role === 'window' || user?.role === 'admin'}
						<a href="/window" class="quick-link">
							<span class="link-icon">🪟</span>
							<span>窗口叫号</span>
						</a>
					{/if}
					{#if user?.role === 'admin'}
						<a href="/admin" class="quick-link">
							<span class="link-icon">⚙️</span>
							<span>系统管理</span>
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		max-width: 1200px;
	}

	.page-title {
		font-size: 24px;
		margin-bottom: 24px;
		color: #262626;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: #8c8c8c;
	}

	.stats-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		border-radius: 8px;
		padding: 24px;
		display: flex;
		align-items: center;
		gap: 16px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	.stat-icon {
		width: 60px;
		height: 60px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28px;
	}

	.stat-icon.waiting { background: #fff7e6; }
	.stat-icon.called { background: #e6f7ff; }
	.stat-icon.completed { background: #f6ffed; }

	.stat-value {
		font-size: 32px;
		font-weight: 700;
		color: #262626;
	}

	.stat-label {
		font-size: 14px;
		color: #8c8c8c;
		margin-top: 4px;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 16px;
	}

	.card {
		background: white;
		border-radius: 8px;
		padding: 24px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	.card h3 {
		font-size: 16px;
		margin-bottom: 16px;
		color: #262626;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th,
	.data-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #f0f0f0;
		font-size: 14px;
	}

	.data-table th {
		background: #fafafa;
		font-weight: 600;
		color: #595959;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.empty {
		text-align: center;
		padding: 40px;
		color: #8c8c8c;
	}

	.quick-links {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: #fafafa;
		border-radius: 8px;
		text-decoration: none;
		color: #262626;
		transition: all 0.3s;
	}

	.quick-link:hover {
		background: #e6f7ff;
		transform: translateX(4px);
	}

	.link-icon {
		font-size: 24px;
	}
</style>
