<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, getUser, statusText, statusColor } from '$lib/api';

	let loading = true;
	let violations = [];
	let user = null;
	let showCreate = false;
	let tab = 'open';

	let newViolation = {
		application_id: '',
		violation_type: '',
		description: ''
	};
	let applications = [];
	let error = '';

	onMount(async () => {
		user = getUser();
		await loadData();
		await loadApplications();
	});

	async function loadData() {
		loading = true;
		try {
			const params = { page_size: 50 };
			if (tab !== 'all') {
				params.status = tab;
			}
			const res = await api.getViolations(params);
			violations = res.list;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function loadApplications() {
		try {
			const res = await api.getApplications({ status: 'approved', page_size: 50 });
			applications = res.list;
		} catch (e) {
			console.error(e);
		}
	}

	async function handleCreate() {
		if (!newViolation.application_id || !newViolation.violation_type) {
			error = '请填写必填项';
			return;
		}
		try {
			await api.createViolation({
				application_id: parseInt(newViolation.application_id),
				violation_type: newViolation.violation_type,
				description: newViolation.description
			});
			alert('违规记录已创建');
			showCreate = false;
			newViolation = { application_id: '', violation_type: '', description: '' };
			loadData();
		} catch (e) {
			alert(e.message);
		}
	}

	async function handleClose(id) {
		const comment = prompt('请输入处理意见：');
		if (comment === null) return;
		try {
			await api.handleViolation(id, comment || '已处理');
			alert('处理成功');
			loadData();
		} catch (e) {
			alert(e.message);
		}
	}

	$: if (tab) loadData();
</script>

<div class="page">
	<div class="page-header">
		<h2>违规记录</h2>
		<div class="actions">
			{#if user && ['admin', 'engineer', 'gate'].includes(user.role)}
				<button class="btn-primary" on:click={() => showCreate = !showCreate}>
					{showCreate ? '取消' : '+ 记录违规'}
				</button>
			{/if}
		</div>
	</div>

	{#if showCreate}
		<div class="create-card">
			<h3>记录违规</h3>
			{#if error}
				<div class="alert error">{error}</div>
			{/if}
			<div class="form-grid">
				<div class="form-group">
					<label>关联申请 <span class="required">*</span></label>
					<select bind:value={newViolation.application_id}>
						<option value="">请选择申请</option>
						{#each applications as app}
							<option value={app.id}>{app.application_no} - {app.building}栋{app.unit}单元{app.room}室</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label>违规类型 <span class="required">*</span></label>
					<select bind:value={newViolation.violation_type}>
						<option value="">请选择</option>
						<option value="超时施工">超时施工</option>
						<option value="噪音扰民">噪音扰民</option>
						<option value="违规作业">违规作业</option>
						<option value="未持证上岗">未持证上岗</option>
						<option value="安全隐患">安全隐患</option>
						<option value="其他">其他</option>
					</select>
				</div>
				<div class="form-group full">
					<label>违规描述</label>
					<textarea bind:value={newViolation.description} rows="3" placeholder="请详细描述违规情况"></textarea>
				</div>
			</div>
			<div class="form-actions">
				<button class="btn-outline" on:click={() => showCreate = false}>取消</button>
				<button class="btn-primary" on:click={handleCreate}>提交</button>
			</div>
		</div>
	{/if}

	<div class="tabs">
		<button class="tab {tab === 'open' ? 'active' : ''}" on:click={() => tab = 'open'}">
			待处理
		</button>
		<button class="tab {tab === 'closed' ? 'active' : ''}" on:click={() => tab = 'closed'}">
			已处理
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
							<th>违规时间</th>
							<th>申请编号</th>
							<th>施工队</th>
							<th>违规类型</th>
							<th>描述</th>
							<th>状态</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each violations as v}
							<tr>
								<td>{new Date(v.violation_time).toLocaleString('zh-CN')}</td>
								<td>{v.application_no || '-'}</td>
								<td>{v.team_name || '-'}</td>
								<td>{v.violation_type}</td>
								<td class="desc">{v.description || '-'}</td>
								<td>
									<span class="status-badge" style="background: {statusColor[v.status]}20; color: {statusColor[v.status]}">
										{statusText[v.status]}
									</span>
								</td>
								<td>
									{#if v.status === 'open' && user && ['admin', 'engineer'].includes(user.role)}
										<button class="link-btn" on:click={() => handleClose(v.id)}>处理</button>
									{/if}
								</td>
							</tr>
						{/each}
						{#if violations.length === 0}
							<tr><td colspan="7" class="empty">暂无数据</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
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
	.btn-primary {
		padding: 8px 20px;
		background: #3b82f6;
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
	.create-card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		padding: 20px;
		margin-bottom: 16px;
	}
	.create-card h3 { font-size: 16px; margin-bottom: 16px; }
	.alert {
		padding: 10px 14px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
	}
	.alert.error { background: #fef2f2; color: #dc2626; }
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}
	.form-group { display: flex; flex-direction: column; gap: 6px; }
	.form-group.full { grid-column: 1 / -1; }
	.form-group label { font-size: 14px; color: #374151; font-weight: 500; }
	.form-group .required { color: #ef4444; }
	.form-group select, .form-group textarea {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		outline: none;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 16px;
	}
	.tabs {
		display: inline-flex;
		gap: 4px;
		margin-bottom: 16px;
		background: white;
		padding: 4px;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
	.tab.active { background: #3b82f6; color: white; }
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
	.data-table td.desc { max-width: 200px; }
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
