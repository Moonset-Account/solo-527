<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, type Batch, type RestockTodo } from '$lib/api';

	let user: any = null;
	let batches: Batch[] = [];
	let restockTodos: RestockTodo[] = [];
	let backupRecords: any[] = [];
	let smsNotifications: any[] = [];
	let activeTab = 'inventory';
	let loading = true;
	let message = '';
	let messageType = '';

	onMount(async () => {
		const savedUser = localStorage.getItem('user');
		if (!savedUser) {
			goto('/login');
			return;
		}
		user = JSON.parse(savedUser);

		if (user.role !== 'admin') {
			goto('/');
			return;
		}

		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [batchRes, restockRes, backupRes, smsRes] = await Promise.all([
				api.getAllBatches(),
				api.getRestockTodos(),
				api.getBackupRecords().catch(() => ({ backup_records: [] })),
				api.getSmsNotifications().catch(() => ({ sms_notifications: [] }))
			]);
			batches = batchRes.batches;
			restockTodos = restockRes.restock_todos;
			backupRecords = backupRes.backup_records || [];
			smsNotifications = smsRes.sms_notifications || [];
		} catch (e: any) {
			showMessage(e.message, 'error');
		} finally {
			loading = false;
		}
	}

	async function handleCreateBackup() {
		try {
			await api.createBackup();
			showMessage('备份创建成功', 'success');
			await loadData();
		} catch (e: any) {
			showMessage(e.message, 'error');
		}
	}

	async function handleCompleteRestock(id: number) {
		const quantity = prompt('请输入补货数量：', '100');
		if (!quantity) return;
		try {
			await api.completeRestockTodo(id, parseInt(quantity));
			showMessage('补货完成', 'success');
			await loadData();
		} catch (e: any) {
			showMessage(e.message, 'error');
		}
	}

	function showMessage(msg: string, type: string) {
		message = msg;
		messageType = type;
		setTimeout(() => {
			message = '';
		}, 3000);
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<div class="page">
	<h2 class="page-title">⚙️ 系统管理</h2>

	{#if message}
		<div class="message {messageType}">{message}</div>
	{/if}

	<div class="tabs">
		<button class:active={activeTab === 'inventory'} on:click={() => activeTab = 'inventory'}>
			📦 库存管理
		</button>
		<button class:active={activeTab === 'restock'} on:click={() => activeTab = 'restock'}>
			🔔 补货待办
		</button>
		<button class:active={activeTab === 'backup'} on:click={() => activeTab = 'backup'}>
			💾 数据备份
		</button>
		<button class:active={activeTab === 'sms'} on:click={() => activeTab = 'sms'}>
			📱 短信记录
		</button>
	</div>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		{#if activeTab === 'inventory'}
			<div class="card">
				<h3>📦 药品批次库存</h3>
				<table class="data-table">
					<thead>
						<tr>
							<th>药品名称</th>
							<th>药品编码</th>
							<th>批次号</th>
							<th>库存数量</th>
							<th>有效期</th>
						</tr>
					</thead>
					<tbody>
						{#each batches as b}
							<tr class:low={b.quantity < 50}>
								<td>{b.medicine_name}</td>
								<td><code>{b.medicine_code}</code></td>
								<td>{b.batch_no}</td>
								<td>
									<span class="stock-count">{b.quantity}</span>
									{#if b.quantity < 50}
										<span class="low-stock">库存不足</span>
									{/if}
								</td>
								<td>{b.expiry_date}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if activeTab === 'restock'}
			<div class="card">
				<h3>🔔 补货待办 ({restockTodos.filter(t => t.status === 'pending').length} 待处理)</h3>
				{#if restockTodos.length > 0}
					<table class="data-table">
						<thead>
							<tr>
								<th>药品名称</th>
								<th>批次号</th>
								<th>需求数量</th>
								<th>状态</th>
								<th>创建人</th>
								<th>创建时间</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each restockTodos as t}
								<tr>
									<td>{t.medicine_name}</td>
									<td>{t.batch_no || '-'}</td>
									<td>{t.quantity_needed}</td>
									<td>
										<span class="status-badge {t.status}">
											{t.status === 'pending' ? '待补货' : '已完成'}
										</span>
									</td>
									<td>{t.created_by}</td>
									<td>{t.created_at?.slice(0, 16)}</td>
									<td>
										{#if t.status === 'pending'}
											<button class="btn-sm btn-primary" on:click={() => handleCompleteRestock(t.id)}>
												完成补货
											</button>
										{:else}
											<span class="completed-by">
												{t.completed_by} 完成
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="empty">暂无补货待办</p>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'backup'}
			<div class="card">
				<div class="card-header">
					<h3>💾 数据备份</h3>
					<button class="btn-primary" on:click={handleCreateBackup}>
						+ 创建备份
					</button>
				</div>
				{#if backupRecords.length > 0}
					<table class="data-table">
						<thead>
							<tr>
								<th>文件名</th>
								<th>大小</th>
								<th>创建人</th>
								<th>创建时间</th>
							</tr>
						</thead>
						<tbody>
							{#each backupRecords as r}
								<tr>
									<td><code>{r.file_path.split('/').pop()}</code></td>
									<td>{formatSize(r.file_size)}</td>
									<td>{r.created_by}</td>
									<td>{r.created_at?.slice(0, 19)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="empty">暂无备份记录</p>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'sms'}
			<div class="card">
				<h3>📱 短信通知记录</h3>
				{#if smsNotifications.length > 0}
					<table class="data-table">
						<thead>
							<tr>
								<th>处方号</th>
								<th>手机号</th>
								<th>短信内容</th>
								<th>状态</th>
								<th>发送时间</th>
							</tr>
						</thead>
						<tbody>
							{#each smsNotifications as n}
								<tr>
									<td>{n.prescription_no}</td>
									<td>{n.phone}</td>
									<td class="sms-content">{n.content}</td>
									<td>
										<span class="status-badge {n.status}">
											{n.status === 'sent' ? '已发送' : '待发送'}
										</span>
									</td>
									<td>{n.created_at?.slice(0, 19)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="empty">暂无短信记录</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
	}

	.page-title {
		font-size: 24px;
		margin-bottom: 20px;
		color: #262626;
	}

	.tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 20px;
		border-bottom: 2px solid #f0f0f0;
	}

	.tabs button {
		padding: 12px 20px;
		background: none;
		border: none;
		font-size: 14px;
		color: #595959;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		transition: all 0.3s;
	}

	.tabs button:hover {
		color: #1890ff;
	}

	.tabs button.active {
		color: #1890ff;
		border-bottom-color: #1890ff;
		font-weight: 500;
	}

	.card {
		background: white;
		border-radius: 8px;
		padding: 20px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.card h3 {
		font-size: 16px;
		color: #262626;
	}

	.btn-primary {
		background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
	}

	.btn-sm {
		padding: 6px 12px;
		font-size: 12px;
		border: 1px solid #d9d9d9;
		background: white;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-sm.btn-primary {
		background: #1890ff;
		color: white;
		border-color: #1890ff;
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

	.data-table tr.low {
		background: #fff2f0;
	}

	.stock-count {
		font-weight: 600;
		color: #262626;
	}

	.low-stock {
		margin-left: 8px;
		color: #ff4d4f;
		font-size: 12px;
		background: #fff1f0;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-badge.pending {
		background: #fff7e6;
		color: #d46b08;
	}

	.status-badge.completed,
	.status-badge.sent {
		background: #f6ffed;
		color: #389e0d;
	}

	.completed-by {
		font-size: 12px;
		color: #8c8c8c;
	}

	.sms-content {
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.loading, .empty {
		text-align: center;
		padding: 40px;
		color: #8c8c8c;
	}

	.message {
		padding: 12px 16px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
	}

	.message.success {
		background: #f6ffed;
		border: 1px solid #b7eb8f;
		color: #52c41a;
	}

	.message.error {
		background: #fff2f0;
		border: 1px solid #ffccc7;
		color: #ff4d4f;
	}

	code {
		background: #f5f5f5;
		padding: 2px 6px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 13px;
	}
</style>
