<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, type QueueItem, type Window as WindowType, type Prescription } from '$lib/api';

	let user: any = null;
	let queueData: any = null;
	let windows: WindowType[] = [];
	let selectedWindow = 1;
	let loading = true;
	let currentPatient: any = null;
	let message = '';
	let messageType = '';
	let refreshInterval: any;

	onMount(async () => {
		const savedUser = localStorage.getItem('user');
		if (!savedUser) {
			goto('/login');
			return;
		}
		user = JSON.parse(savedUser);

		await loadData();
		refreshInterval = setInterval(loadData, 10000);
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
	});

	async function loadData() {
		try {
			const [queueRes, windowsRes] = await Promise.all([
				api.getQueueStatus(),
				api.getWindows()
			]);
			queueData = queueRes;
			windows = windowsRes.windows;
		} catch (e: any) {
			showMessage(e.message, 'error');
		} finally {
			loading = false;
		}
	}

	async function handleCallNext() {
		try {
			const res = await api.callNext(selectedWindow);
			if (res.message) {
				showMessage(res.message, 'info');
			} else {
				currentPatient = res;
				showMessage(`已叫号：${res.patient_name}，排队号 #${res.queue_no}`, 'success');
			}
			await loadData();
		} catch (e: any) {
			showMessage(e.message, 'error');
		}
	}

	async function handleDispense(prescriptionId: number) {
		if (!confirm('确认发药？发药后库存将自动扣减。')) return;
		try {
			await api.dispense(prescriptionId);
			showMessage('发药成功', 'success');
			currentPatient = null;
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

	const statusLabels: Record<string, string> = {
		waiting: '等待中',
		called: '叫号中',
		completed: '已完成',
		cancelled: '已取消'
	};
</script>

<div class="page">
	<h2 class="page-title">🪟 窗口叫号系统</h2>

	{#if message}
		<div class="message {messageType}">{message}</div>
	{/if}

	<div class="window-selector">
		<label>选择窗口：</label>
		<select bind:value={selectedWindow}>
			{#each windows as w}
				<option value={w.id}>{w.name}</option>
			{/each}
		</select>
	</div>

	<div class="stats-row">
		<div class="stat-card waiting">
			<div class="stat-number">{queueData?.waiting_count || 0}</div>
			<div class="stat-label">等待中</div>
		</div>
		<div class="stat-card called">
			<div class="stat-number">{queueData?.called_count || 0}</div>
			<div class="stat-label">叫号中</div>
		</div>
		<div class="stat-card completed">
			<div class="stat-number">{queueData?.completed_count || 0}</div>
			<div class="stat-label">已完成</div>
		</div>
	</div>

	<div class="action-area">
		<button class="call-btn" on:click={handleCallNext} disabled={loading}>
			🔔 叫下一位
		</button>
	</div>

	{#if currentPatient}
		<div class="current-patient-card">
			<h3>📢 当前叫号</h3>
			<div class="patient-info">
				<div class="queue-number">#{currentPatient.queue_no}</div>
				<div class="patient-name">{currentPatient.patient_name}</div>
				<div class="patient-prescription">处方号：{currentPatient.prescription_no}</div>
			</div>
			<div class="patient-actions">
				<button class="btn-primary" on:click={() => handleDispense(currentPatient.prescription_id)}>
					✅ 确认发药
				</button>
			</div>
		</div>
	{/if}

	<div class="card">
		<h3>📋 当前排队列表</h3>
		{#if loading}
			<div class="loading">加载中...</div>
		{:else if queueData?.queue && queueData.queue.length > 0}
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
					{#each queueData.queue as item}
						<tr class:active={item.status === 'called'}>
							<td><strong>#{item.queue_no}</strong></td>
							<td>{item.prescription_no}</td>
							<td>{item.patient_name}</td>
							<td>
								<span class="status-badge {item.status}">
									{statusLabels[item.status]}
								</span>
							</td>
							<td>{item.window_no || '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty">暂无排队患者</p>
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 1000px;
	}

	.page-title {
		font-size: 24px;
		margin-bottom: 20px;
		color: #262626;
	}

	.window-selector {
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.window-selector label {
		font-size: 14px;
		color: #595959;
	}

	.window-selector select {
		padding: 8px 12px;
		border: 1px solid #d9d9d9;
		border-radius: 6px;
		font-size: 14px;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.stat-card.waiting { border-top: 4px solid #faad14; }
	.stat-card.called { border-top: 4px solid #1890ff; }
	.stat-card.completed { border-top: 4px solid #52c41a; }

	.stat-number {
		font-size: 48px;
		font-weight: 700;
		color: #262626;
		line-height: 1;
	}

	.stat-label {
		font-size: 14px;
		color: #8c8c8c;
		margin-top: 8px;
	}

	.action-area {
		margin-bottom: 24px;
	}

	.call-btn {
		width: 100%;
		padding: 20px;
		font-size: 20px;
		font-weight: 600;
		background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.call-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(82, 196, 26, 0.4);
	}

	.call-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.current-patient-card {
		background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
		border: 2px solid #91d5ff;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 24px;
		text-align: center;
	}

	.current-patient-card h3 {
		font-size: 18px;
		margin-bottom: 16px;
		color: #0050b3;
	}

	.queue-number {
		font-size: 64px;
		font-weight: 700;
		color: #1890ff;
		line-height: 1;
	}

	.patient-name {
		font-size: 28px;
		font-weight: 600;
		color: #262626;
		margin: 12px 0;
	}

	.patient-prescription {
		font-size: 16px;
		color: #595959;
		margin-bottom: 20px;
	}

	.patient-actions .btn-primary {
		background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
		color: white;
		border: none;
		padding: 12px 40px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
	}

	.card {
		background: white;
		border-radius: 8px;
		padding: 20px;
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

	.data-table tr.active {
		background: #e6f7ff;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-badge.waiting {
		background: #fff7e6;
		color: #d46b08;
	}

	.status-badge.called {
		background: #e6f7ff;
		color: #096dd9;
	}

	.status-badge.completed {
		background: #f6ffed;
		color: #389e0d;
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

	.message.info {
		background: #e6f7ff;
		border: 1px solid #91d5ff;
		color: #1890ff;
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
</style>
