<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api } from '$lib/api';

	let loading = true;
	let teams = [];
	let error = '';
	let app = null;

	let form = {};

	onMount(async () => {
		try {
			teams = await api.getTeams();
			app = await api.getApplication($page.params.id);
			form = {
				owner_name: app.owner_name,
				owner_phone: app.owner_phone || '',
				building: app.building,
				unit: app.unit,
				room: app.room,
				team_id: app.team_id || '',
				work_types: app.work_types,
				material_entry_time: app.material_entry_time ? app.material_entry_time.slice(0, 16) : '',
				start_date: app.start_date,
				end_date: app.end_date,
				has_noise_work: app.has_noise_work,
				noise_time_slots: app.noise_time_slots || ''
			};
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	});

	async function handleSubmit() {
		if (!form.owner_name || !form.building || !form.unit || !form.room || !form.start_date || !form.end_date || !form.work_types) {
			error = '请填写必填项';
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
			await api.updateApplication(app.id, data);
			alert('更新成功');
			goto(`/applications/${app.id}`);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<h2>编辑施工申请</h2>
		<button class="btn-outline" on:click={() => history.back()}>返回</button>
	</div>

	{#if loading && !app}
		<div class="loading">加载中...</div>
	{:else}
		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		<div class="card">
			<div class="form-grid">
				<div class="section-title">业主信息</div>

				<div class="form-group">
					<label>业主姓名 <span class="required">*</span></label>
					<input type="text" bind:value={form.owner_name} />
				</div>
				<div class="form-group">
					<label>联系电话</label>
					<input type="text" bind:value={form.owner_phone} />
				</div>

				<div class="section-title">房屋信息</div>

				<div class="form-group">
					<label>楼栋 <span class="required">*</span></label>
					<input type="text" bind:value={form.building} />
				</div>
				<div class="form-group">
					<label>单元 <span class="required">*</span></label>
					<input type="text" bind:value={form.unit} />
				</div>
				<div class="form-group">
					<label>房号 <span class="required">*</span></label>
					<input type="text" bind:value={form.room} />
				</div>

				<div class="section-title">施工信息</div>

				<div class="form-group">
					<label>施工队</label>
					<select bind:value={form.team_id}>
						<option value="">请选择施工队</option>
						{#each teams as team}
							<option value={team.id}>{team.name}</option>
						{/each}
					</select>
				</div>
				<div class="form-group full">
					<label>工种 <span class="required">*</span></label>
					<input type="text" bind:value={form.work_types} />
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
						<input type="text" bind:value={form.noise_time_slots} />
					</div>
				{/if}
			</div>

			<div class="form-actions">
				<button class="btn-outline" on:click={() => history.back()}>取消</button>
				<button class="btn-primary" on:click={handleSubmit} disabled={loading}>
					{loading ? '保存中...' : '保存修改'}
				</button>
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
	.loading { text-align: center; padding: 60px 0; color: #9ca3af; }
	.alert {
		padding: 12px 16px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
	}
	.alert.error { background: #fef2f2; color: #dc2626; }
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
	.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
	.checkbox-label input { width: auto; }
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
