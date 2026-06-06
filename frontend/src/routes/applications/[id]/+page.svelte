<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api, getUser, statusText, statusColor } from '$lib/api';

	let loading = true;
	let app = null;
	let user = null;
	let showReview = false;
	let reviewStatus = 'approved';
	let reviewComment = '';
	let error = '';

	onMount(async () => {
		user = getUser();
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			app = await api.getApplication($page.params.id);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function handleReview() {
		if (!reviewComment && reviewStatus !== 'approved') {
			alert('请填写审核意见');
			return;
		}
		try {
			await api.reviewApplication(app.id, reviewStatus, reviewComment);
			alert('审核成功');
			showReview = false;
			loadData();
		} catch (e) {
			alert(e.message);
		}
	}

	function canReview() {
		if (!user) return false;
		if (!['admin', 'engineer'].includes(user.role)) return false;
		return app && (app.status === 'pending' || app.status === 'manual_review');
	}

	function canEdit() {
		return app && (app.status === 'returned' || app.status === 'pending');
	}
</script>

<div class="page">
	<div class="page-header">
		<h2>申请详情</h2>
		<div class="actions">
			<button class="btn-outline" on:click={() => goto('/applications')}>← 返回列表</button>
			{#if canEdit()}
				<button class="btn-secondary" on:click={() => goto(`/applications/${app.id}/edit`)}>编辑</button>
			{/if}
			{#if canReview()}
				<button class="btn-primary" on:click={() => showReview = !showReview}>
					{showReview ? '取消审核' : '审核'}
				</button>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else if error}
		<div class="alert error">{error}</div>
	{:else if app}
		<div class="detail-card">
			<div class="detail-header">
				<div>
					<h3>{app.application_no}</h3>
					<span class="status-badge" style="background: {statusColor[app.status]}20; color: {statusColor[app.status]}">
						{statusText[app.status]}
					</span>
				</div>
				<p class="create-time">创建时间：{new Date(app.created_at).toLocaleString('zh-CN')}</p>
			</div>

			{#if showReview && canReview()}
				<div class="review-section">
					<h4>审核处理</h4>
					<div class="review-form">
						<div class="form-group">
							<label>审核结果</label>
							<select bind:value={reviewStatus}>
								<option value="approved">通过</option>
								<option value="returned">退回修改</option>
								<option value="rejected">拒绝</option>
							</select>
						</div>
						<div class="form-group">
							<label>审核意见</label>
							<textarea bind:value={reviewComment} rows="3" placeholder="请输入审核意见"></textarea>
						</div>
						<div class="review-actions">
							<button class="btn-outline" on:click={() => showReview = false}>取消</button>
							<button class="btn-primary" on:click={handleReview}>确认审核</button>
						</div>
					</div>
				</div>
			{/if}

			{#if app.review_comment}
				<div class="review-info">
					<h4>审核信息</h4>
					<p><strong>审核人：</strong>{app.reviewer_name || '-'}</p>
					<p><strong>审核时间：</strong>{app.reviewed_at ? new Date(app.reviewed_at).toLocaleString('zh-CN') : '-'}</p>
					<p><strong>审核意见：</strong>{app.review_comment}</p>
				</div>
			{/if}

			<div class="detail-grid">
				<div class="detail-section">
					<h4>业主信息</h4>
					<div class="detail-row"><span>业主姓名</span><span>{app.owner_name}</span></div>
					<div class="detail-row"><span>联系电话</span><span>{app.owner_phone || '-'}</span></div>
				</div>

				<div class="detail-section">
					<h4>房屋信息</h4>
					<div class="detail-row"><span>楼栋</span><span>{app.building}栋</span></div>
					<div class="detail-row"><span>单元</span><span>{app.unit}单元</span></div>
					<div class="detail-row"><span>房号</span><span>{app.room}室</span></div>
				</div>

				<div class="detail-section">
					<h4>施工信息</h4>
					<div class="detail-row"><span>施工队</span><span>{app.team_name || '-'}</span></div>
					<div class="detail-row"><span>工种</span><span>{app.work_types}</span></div>
					<div class="detail-row">
						<span>材料进场时间</span>
						<span>{app.material_entry_time ? new Date(app.material_entry_time).toLocaleString('zh-CN') : '-'}</span>
					</div>
					<div class="detail-row"><span>施工日期</span><span>{app.start_date} 至 {app.end_date}</span></div>
					<div class="detail-row">
						<span>噪音作业</span>
						<span class="{app.has_noise_work ? 'text-warning' : ''}">
							{app.has_noise_work ? '是' : '否'}
						</span>
					</div>
					{#if app.has_noise_work}
						<div class="detail-row"><span>噪音时段</span><span>{app.noise_time_slots || '-'}</span></div>
					{/if}
				</div>
			</div>

			{#if app.status === 'approved' && app.qr_code}
				<div class="qr-section">
					<h4>门岗通行码</h4>
					<p class="qr-code-text">二维码：{app.qr_code}</p>
					<p class="help-text">门岗扫描此二维码核验施工人员和车辆</p>
				</div>
			{/if}
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
	.actions { display: flex; gap: 10px; }
	.loading { text-align: center; padding: 60px 0; color: #9ca3af; }
	.alert {
		padding: 12px 16px;
		border-radius: 6px;
		font-size: 14px;
	}
	.alert.error { background: #fef2f2; color: #dc2626; }
	.detail-card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		overflow: hidden;
	}
	.detail-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.detail-header h3 { font-size: 18px; margin-bottom: 8px; }
	.status-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
	}
	.create-time { font-size: 13px; color: #6b7280; }
	.review-section {
		padding: 20px 24px;
		background: #eff6ff;
		border-bottom: 1px solid #dbeafe;
	}
	.review-section h4 {
		font-size: 15px;
		margin-bottom: 16px;
		color: #1e40af;
	}
	.review-form { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
	.form-group { display: flex; flex-direction: column; gap: 6px; }
	.form-group label { font-size: 14px; color: #374151; font-weight: 500; }
	.form-group select, .form-group textarea {
		padding: 10px 12px;
		border: 1px solid #93c5fd;
		border-radius: 6px;
		font-size: 14px;
		outline: none;
		background: white;
	}
	.review-actions {
		grid-column: 1 / -1;
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}
	.review-info {
		padding: 16px 24px;
		background: #f0fdf4;
		border-bottom: 1px solid #bbf7d0;
	}
	.review-info h4 { font-size: 14px; margin-bottom: 8px; color: #166534; }
	.review-info p { font-size: 13px; color: #374151; margin: 4px 0; }
	.detail-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		padding: 24px;
	}
	.detail-section h4 {
		font-size: 15px;
		margin-bottom: 12px;
		color: #1f2937;
		padding-bottom: 8px;
		border-bottom: 1px solid #f3f4f6;
	}
	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		font-size: 14px;
	}
	.detail-row > span:first-child { color: #6b7280; }
	.detail-row > span:last-child { color: #1f2937; font-weight: 500; }
	.text-warning { color: #d97706 !important; }
	.qr-section {
		padding: 20px 24px;
		background: #fefce8;
		border-top: 1px solid #fde68a;
	}
	.qr-section h4 { font-size: 15px; margin-bottom: 8px; color: #854d0e; }
	.qr-code-text {
		font-family: monospace;
		font-size: 13px;
		color: #374151;
		padding: 10px;
		background: white;
		border: 1px dashed #d1d5db;
		border-radius: 6px;
		word-break: break-all;
	}
	.help-text { font-size: 12px; color: #6b7280; margin-top: 6px; }
	.btn-primary {
		padding: 8px 20px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.btn-secondary {
		padding: 8px 20px;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.btn-outline {
		padding: 8px 20px;
		background: white;
		color: #6b7280;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
</style>
