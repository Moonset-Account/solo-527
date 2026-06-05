<script lang="ts">
	import { api } from '$lib/api';

	let prescriptionNo = '';
	let loading = false;
	let error = '';
	let result: any = null;

	async function handleSearch(e: Event) {
		e.preventDefault();
		if (!prescriptionNo.trim()) return;

		loading = true;
		error = '';
		result = null;

		try {
			const token = localStorage.getItem('token') || 'patient-mode';
			const res = await fetch(`/api/prescriptions/${prescriptionNo}`, {
				headers: {
					'Content-Type': 'application/json',
					...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
				}
			});
			if (!res.ok) {
				throw new Error('未找到该处方号，请检查后重试');
			}
			result = await res.json();
		} catch (err: any) {
			error = err.message || '查询失败';
		} finally {
			loading = false;
		}
	}

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

	function backToLogin() {
		window.location.href = '/login';
	}
</script>

<div class="patient-page">
	<header class="patient-header">
		<div class="header-content">
			<span class="logo">💊</span>
			<h1>社区药房处方取药查询</h1>
		</div>
		<button on:click={backToLogin} class="back-btn">← 工作人员登录</button>
	</header>

	<main class="patient-main">
		<div class="search-card">
			<h2>🔍 查询处方排队状态</h2>
			<form class="search-form" on:submit={handleSearch}>
				<input
					type="text"
					bind:value={prescriptionNo}
					placeholder="请输入处方号"
					required
				/>
				<button type="submit" disabled={loading}>
					{loading ? '查询中...' : '立即查询'}
				</button>
			</form>
			{#if error}
				<div class="error-message">{error}</div>
			{/if}
		</div>

		{#if result}
			<div class="result-card">
				<h3>📋 处方信息</h3>
				<div class="info-grid">
					<div class="info-item">
						<span class="label">处方号</span>
						<span class="value">{result.prescription.prescription_no}</span>
					</div>
					<div class="info-item">
						<span class="label">患者姓名</span>
						<span class="value">{result.prescription.patient_name}</span>
					</div>
					<div class="info-item">
						<span class="label">当前状态</span>
						<span class="status-badge" style="background: {statusColors[result.prescription.status]}20; color: {statusColors[result.prescription.status]}">
							{statusLabels[result.prescription.status]}
						</span>
					</div>
					{#if result.prescription.queue_no}
						<div class="info-item">
							<span class="label">排队号</span>
							<span class="value highlight">#{result.prescription.queue_no}</span>
						</div>
					{/if}
					<div class="info-item">
						<span class="label">取药时间</span>
						<span class="value">{result.prescription.pick_up_time}</span>
					</div>
				</div>

				{#if result.ahead_count !== undefined && result.prescription.status === 'queued'}
					<div class="queue-info">
						<span class="queue-icon">⏳</span>
						<strong>前方还有 {result.ahead_count} 人等待</strong>
						<p>请耐心等候叫号</p>
					</div>
				{/if}

				{#if result.items && result.items.length > 0}
					<div class="medicines-section">
						<h4>💊 药品清单</h4>
						<table class="med-table">
							<thead>
								<tr>
									<th>药品名称</th>
									<th>批次号</th>
									<th>数量</th>
									<th>状态</th>
								</tr>
							</thead>
							<tbody>
								{#each result.items as item}
									<tr>
										<td>{item.medicine_name}</td>
										<td>{item.batch_no}</td>
										<td>{item.quantity}</td>
										<td>
											{#if item.alternative_batch_no}
												<span class="alt-badge">有替代批次</span>
											{:else}
												-
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

				{#if result.prescription.is_manual_entry}
					<div class="manual-entry-info">
						<strong>📝 补录记录：</strong>
						<p>补录人：{result.prescription.manual_entry_by || '未知'}</p>
						<p>补录时间：{result.prescription.manual_entry_at || '未知'}</p>
						{#if result.prescription.manual_entry_reason}
							<p>补录原因：{result.prescription.manual_entry_reason}</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>

<style>
	.patient-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e6f7ff 0%, #f0f5ff 100%);
	}

	.patient-header {
		background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
		color: white;
		padding: 20px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo {
		font-size: 32px;
	}

	.patient-header h1 {
		font-size: 20px;
		font-weight: 600;
	}

	.back-btn {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}

	.patient-main {
		max-width: 600px;
		margin: 0 auto;
		padding: 32px 20px;
	}

	.search-card,
	.result-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		margin-bottom: 20px;
	}

	.search-card h2 {
		font-size: 18px;
		margin-bottom: 20px;
		color: #262626;
	}

	.search-form {
		display: flex;
		gap: 12px;
	}

	.search-form input {
		flex: 1;
		padding: 14px 16px;
		border: 2px solid #d9d9d9;
		border-radius: 8px;
		font-size: 16px;
		transition: all 0.3s;
	}

	.search-form input:focus {
		outline: none;
		border-color: #1890ff;
	}

	.search-form button {
		padding: 14px 32px;
		background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.search-form button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.error-message {
		background: #fff2f0;
		border: 1px solid #ffccc7;
		color: #ff4d4f;
		padding: 12px;
		border-radius: 6px;
		margin-top: 16px;
		font-size: 14px;
	}

	.result-card h3 {
		font-size: 18px;
		margin-bottom: 20px;
		color: #262626;
		padding-bottom: 12px;
		border-bottom: 2px solid #f0f0f0;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
		margin-bottom: 20px;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label {
		font-size: 13px;
		color: #8c8c8c;
	}

	.value {
		font-size: 15px;
		color: #262626;
		font-weight: 500;
	}

	.value.highlight {
		font-size: 24px;
		color: #1890ff;
		font-weight: 700;
	}

	.status-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
		width: fit-content;
	}

	.queue-info {
		background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
		border: 1px solid #ffd591;
		border-radius: 8px;
		padding: 16px;
		text-align: center;
		margin-bottom: 20px;
	}

	.queue-icon {
		font-size: 32px;
		display: block;
		margin-bottom: 8px;
	}

	.queue-info strong {
		font-size: 18px;
		color: #d46b08;
		display: block;
		margin-bottom: 4px;
	}

	.queue-info p {
		font-size: 14px;
		color: #d46b08;
	}

	.medicines-section {
		margin-top: 20px;
	}

	.medicines-section h4 {
		font-size: 16px;
		margin-bottom: 12px;
		color: #262626;
	}

	.med-table {
		width: 100%;
		border-collapse: collapse;
	}

	.med-table th,
	.med-table td {
		padding: 10px 12px;
		text-align: left;
		border-bottom: 1px solid #f0f0f0;
		font-size: 14px;
	}

	.med-table th {
		background: #fafafa;
		font-weight: 600;
		color: #595959;
	}

	.alt-badge {
		background: #f6ffed;
		color: #52c41a;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 12px;
	}

	.manual-entry-info {
		margin-top: 20px;
		padding: 16px;
		background: #fffbe6;
		border: 1px solid #ffe58f;
		border-radius: 8px;
		font-size: 13px;
		color: #873800;
	}

	.manual-entry-info p {
		margin-top: 4px;
	}
</style>
