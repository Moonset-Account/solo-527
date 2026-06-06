<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';

	let loading = false;
	let teams = [];
	let error = '';
	let noiseTip = '';

	let form = {
		owner_name: '',
		owner_phone: '',
		building: '',
		unit: '',
		room: '',
		team_id: '',
		work_types: '',
		material_entry_time: '',
		start_date: '',
		end_date: '',
		has_noise_work: false,
		noise_time_slots: ''
	};

	onMount(async () => {
		try {
			teams = await api.getTeams();
		} catch (e) {
			console.error(e);
		}
	});

	async function checkNoiseDate() {
		if (form.start_date && form.has_noise_work) {
			try {
				const res = await api.checkNoiseDate(form.start_date);
				noiseTip = res.message;
			} catch (e) {
				noiseTip = '';
			}
		} else {
			noiseTip = '';
		}
	}

	$: checkNoiseDate();

	async function handleSubmit() {
		if (!form.owner_name || !form.building || !form.unit || !form.room || !form.start_date || !form.end_date || !form.work_types) {
			error = '请填写必填项';
			return;
		}
		if (form.start_date > form.end_date) {
			error = '开始日期不能晚于结束日期';
			return;
		}
		loading = true;
		error = '';
		try {
			const data = { ...form };
			if (form.team_id) {
				data.team_id = parseInt(form.team_id);
			}
			if (!data.material_entry_time) {
				delete data.material_entry_time;
			}
			if (!data.noise_time_slots) {
				delete data.noise_time_slots;
			}
			const res = await api.createApplication(data);
			alert(`申请提交成功！申请编号：${res.application_no}`);
			goto('/applications');
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<h2>新建施工申请</h2>
		<button class="btn-outline" on:click={() => history.back()}>返回</button>
	</div>

	{#if error}
		<div class="alert error">{error}</div>
	{/if}
	{#if noiseTip && form.has_noise_work}
		<div class="alert warning">{noiseTip}</div>
	{/if}

	<div class="card">
		<div class="form-grid">
			<div class="section-title">业主信息</div>

			<div class="form-group">
				<label>业主姓名 <span class="required">*</span></label>
				<input type="text" bind:value={form.owner_name} placeholder="请输入业主姓名" />
			</div>
			<div class="form-group">
				<label>联系电话</label>
				<input type="text" bind:value={form.owner_phone} placeholder="请输入联系电话" />
			</div>

			<div class="section-title">房屋信息</div>

			<div class="form-group">
				<label>楼栋 <span class="required">*</span></label>
				<input type="text" bind:value={form.building} placeholder="如：1" />
			</div>
			<div class="form-group">
				<label>单元 <span class="required">*</span></label>
				<input type="text" bind:value={form.unit} placeholder="如：2" />
			</div>
			<div class="form-group">
				<label>房号 <span class="required">*</span></label>
				<input type="text" bind:value={form.room} placeholder="如：301" />
			</div>

			<div class="section-title">施工信息</div>

			<div class="form-group">
				<label>施工队</label>
				<select bind:value={form.team_id}>
					<option value="">请选择施工队</option>
					{#each teams as team}
						<option value={team.id}>
							{team.name} {team.needs_manual_review ? '(需人工复核)' : ''}
						</option>
					{/each}
				</select>
			</div>
			<div class="form-group full">
				<label>工种 <span class="required">*</span></label>
				<input type="text" bind:value={form.work_types} placeholder="如：水电工、泥工、木工" />
			</div>
			<div class="form-group">
				<label>材料进场时间</label>
				<input type="datetime-local" bind:value={form.material_entry_time} />
			</div>
			<div class="form-group">
				<label>施工开始日期 <span class="required">*</span></label>
				<input type="date" bind:value={form.start_date} />
			</div>
			<div class="form-group">
				<label>施工结束日期 <span class="required">*</span></label>
				<input type="date" bind:value={form.end_date} />
			</div>

			<div class="form-group full">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={form.has_noise_work} />
					是否有噪音作业
				</label>
			</div>

			{#if form.has_noise_work}
				<div class="form-group full">
					<label>噪音作业时段</label>
					<input type="text" bind:value={form.noise_time_slots} placeholder="如：工作日 9:00-11:30, 14:30-17:30" />
					<p class="help-text">节假日禁止噪音作业，系统会自动校验</p>
				</div>
			{/if}
		</div>

		<div class="form-actions">
			<button class="btn-outline" on:click={() => history.back()}>取消</button>
			<button class="btn-primary" on:click={handleSubmit} disabled={loading}>
				{loading ? '提交中...' : '提交申请'}
			</button>
		</div>
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
	.alert {
		padding: 12px 16px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
	}
	.alert.error { background: #fef2f2; color: #dc2626; }
	.alert.warning { background: #fffbeb; color: #d97706; }
	.card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		padding: 24px;
	}
	.form-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}
	.section-title {
		grid-column: 1 / -1;
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
		padding-bottom: 8px;
		border-bottom: 1px solid #e5e7eb;
		margin-top: 8px;
	}
	.form-group { display: flex; flex-direction: column; gap: 6px; }
	.form-group.full { grid-column: 1 / -1; }
	.form-group label {
		font-size: 14px;
		color: #374151;
		font-weight: 500;
	}
	.form-group .required { color: #ef4444; }
	.form-group input, .form-group select {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		outline: none;
	}
	.form-group input:focus, .form-group select:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}
	.checkbox-label input { width: auto; }
	.help-text {
		font-size: 12px;
		color: #6b7280;
		margin-top: 4px;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid #e5e7eb;
	}
	.btn-primary {
		padding: 10px 24px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-outline {
		padding: 10px 24px;
		background: white;
		color: #6b7280;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
</style>
