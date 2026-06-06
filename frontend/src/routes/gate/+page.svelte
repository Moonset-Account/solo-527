<script>
	import { onMount } from 'svelte';
	import { api, statusText, statusColor } from '$lib/api';

	let qrCode = '';
	let result = null;
	let error = '';
	let loading = false;
	let records = [];
	let showRecords = false;

	onMount(async () => {
		loadRecords();
	});

	async function loadRecords() {
		try {
			const res = await api.getVerificationRecords({ page_size: 10 });
			records = res.list;
		} catch (e) {
			console.error(e);
		}
	}

	async function handleVerify() {
		if (!qrCode.trim()) {
			error = '请输入二维码内容';
			return;
		}
		loading = true;
		error = '';
		result = null;
		try {
			result = await api.verifyQR(qrCode.trim());
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
			loadRecords();
		}
	}

	function handleKey(e) {
		if (e.key === 'Enter') handleVerify();
	}
</script>

<div class="page">
	<div class="page-header">
		<h2>门岗核验</h2>
		<button class="btn-outline" on:click={() => showRecords = !showRecords}>
			{showRecords ? '返回核验' : '查看记录'}
		</button>
	</div>

	{#if !showRecords}
		<div class="verify-card">
			<h3>扫码核验</h3>
			<p class="subtitle">输入或扫描通行码进行核验</p>

			<div class="qr-input">
				<input
					type="text"
					bind:value={qrCode}
					placeholder="请输入二维码内容..."
					on:keydown={handleKey}
				/>
				<button class="btn-primary" on:click={handleVerify} disabled={loading}>
					{loading ? '核验中...' : '核验'}
				</button>
			</div>

			{#if error}
				<div class="result failed">
					<div class="result-icon">❌</div>
					<div class="result-title">核验失败</div>
					<div class="result-detail">{error}</div>
				</div>
			{/if}

			{#if result}
				<div class="result {result.result === 'passed' ? 'success' : 'failed'}">
					<div class="result-icon">{result.result === 'passed' ? '✅' : '⚠️'}</div>
					<div class="result-title">{result.result === 'passed' ? '核验通过' : '核验不通过'}</div>
					<div class="result-detail">{result.detail}</div>

					{#if result.result === 'passed'}
						<div class="detail-grid">
							<div class="detail-row">
								<span>申请编号</span><span>{result.application_no}</span>
							</div>
							<div class="detail-row">
								<span>业主</span><span>{result.owner_name}</span>
							</div>
							<div class="detail-row">
								<span>施工队</span><span>{result.team_name}</span>
							</div>
							<div class="detail-row highlight">
								<span>允许区域</span><span>{result.allowed_areas}</span>
							</div>
							<div class="detail-row">
								<span>有效期</span><span>{result.start_date} 至 {result.end_date}</span>
							</div>
							{#if result.has_noise_work}
								<div class="detail-row warning">
									<span>噪音作业</span><span>是 ({result.noise_time_slots})</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="card">
			<h3 class="card-title">核验记录</h3>
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>时间</th>
							<th>申请编号</th>
							<th>结果</th>
							<th>详情</th>
							<th>核验人</th>
						</tr>
					</thead>
					<tbody>
						{#each records as r}
							<tr>
								<td>{new Date(r.verified_at).toLocaleString('zh-CN')}</td>
								<td>{r.application_no || '-'}</td>
								<td>
									<span class="status-badge" style="background: {r.result === 'passed' ? '#d1fae5' : '#fee2e2'}; color: {r.result === 'passed' ? '#059669' : '#dc2626'}">
										{r.result === 'passed' ? '通过' : '失败'}
									</span>
								</td>
								<td>{r.detail}</td>
								<td>{r.verifier_name || '-'}</td>
							</tr>
						{/each}
						{#if records.length === 0}
							<tr><td colspan="5" class="empty">暂无记录</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
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
	.verify-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		padding: 32px;
		max-width: 600px;
		margin: 0 auto;
	}
	.verify-card h3 {
		font-size: 20px;
		text-align: center;
		margin-bottom: 8px;
	}
	.subtitle {
		text-align: center;
		color: #6b7280;
		margin-bottom: 24px;
	}
	.qr-input {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}
	.qr-input input {
		flex: 1;
		padding: 12px 16px;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 15px;
		outline: none;
	}
	.qr-input input:focus { border-color: #3b82f6; }
	.btn-primary {
		padding: 12px 28px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 15px;
		font-weight: 500;
	}
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-outline {
		padding: 8px 20px;
		background: white;
		color: #6b7280;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.result {
		padding: 24px;
		border-radius: 10px;
		text-align: center;
	}
	.result.success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
	}
	.result.failed {
		background: #fef2f2;
		border: 1px solid #fecaca;
	}
	.result-icon { font-size: 48px; margin-bottom: 12px; }
	.result-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
	.result-detail { color: #374151; margin-bottom: 16px; }
	.detail-grid {
		text-align: left;
		background: white;
		border-radius: 8px;
		padding: 16px;
		margin-top: 16px;
	}
	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		font-size: 14px;
		border-bottom: 1px solid #f3f4f6;
	}
	.detail-row:last-child { border-bottom: none; }
	.detail-row > span:first-child { color: #6b7280; }
	.detail-row > span:last-child { font-weight: 500; }
	.detail-row.highlight > span:last-child { color: #059669; font-weight: 600; }
	.detail-row.warning > span:last-child { color: #d97706; }
	.card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		overflow: hidden;
	}
	.card-title { padding: 16px 20px; font-size: 16px; border-bottom: 1px solid #e5e7eb; }
	.table-wrapper { overflow-x: auto; }
	.data-table { width: 100%; border-collapse: collapse; }
	.data-table th {
		text-align: left;
		padding: 12px 16px;
		font-size: 13px;
		color: #6b7280;
		font-weight: 500;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}
	.data-table td {
		padding: 12px 16px;
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
	.empty { text-align: center; color: #9ca3af; padding: 40px 0 !important; }
</style>
