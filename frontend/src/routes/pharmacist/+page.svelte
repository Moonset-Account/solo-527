<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, type Medicine, type Batch, type Prescription } from '$lib/api';

	let user: any = null;
	let prescriptions: Prescription[] = [];
	let medicines: Medicine[] = [];
	let batches: Batch[] = [];
	let loading = true;
	let showCreateModal = false;
	let showRescheduleModal = false;
	let selectedPrescription: Prescription | null = null;
	let newPickUpTime = '';
	let rescheduleReason = '';
	let message = '';
	let messageType = '';

	let formData = {
		prescription_no: '',
		patient_name: '',
		patient_phone: '',
		id_card: '',
		pick_up_time: new Date().toISOString().slice(0, 16),
		expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
		is_manual_entry: false,
		manual_reason: '',
		items: [{ medicine_id: 0, batch_id: 0, quantity: 1 }]
	};

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

	onMount(async () => {
		const savedUser = localStorage.getItem('user');
		if (!savedUser) {
			goto('/login');
			return;
		}
		user = JSON.parse(savedUser);

		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [prescRes, medRes, batchRes] = await Promise.all([
				api.getPrescriptions(),
				api.getMedicines(),
				api.getAllBatches()
			]);
			prescriptions = prescRes.prescriptions;
			medicines = medRes.medicines;
			batches = batchRes.batches;
		} catch (e: any) {
			showMessage(e.message, 'error');
		} finally {
			loading = false;
		}
	}

	function addItem() {
		formData.items = [...formData.items, { medicine_id: 0, batch_id: 0, quantity: 1 }];
	}

	function removeItem(index: number) {
		formData.items = formData.items.filter((_, i) => i !== index);
	}

	function getBatchesForMedicine(medicineId: number) {
		return batches.filter(b => {
			const med = medicines.find(m => m.id === medicineId);
			return med && b.medicine_name === med.name;
		});
	}

	async function handleCreate() {
		try {
			if (formData.is_manual_entry && !formData.manual_reason.trim()) {
				showMessage('人工补录必须填写补录原因', 'error');
				return;
			}

			const validItems = formData.items.filter(i => i.medicine_id > 0 && i.batch_id > 0);
			if (validItems.length === 0) {
				showMessage('请至少添加一种药品', 'error');
				return;
			}

			await api.createPrescription({
				...formData,
				items: validItems,
				pick_up_time: new Date(formData.pick_up_time).toISOString()
			});

			showMessage('处方创建成功', 'success');
			showCreateModal = false;
			resetForm();
			await loadData();
		} catch (e: any) {
			showMessage(e.message, 'error');
		}
	}

	function resetForm() {
		formData = {
			prescription_no: '',
			patient_name: '',
			patient_phone: '',
			id_card: '',
			pick_up_time: new Date().toISOString().slice(0, 16),
			expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
			is_manual_entry: false,
			manual_reason: '',
			items: [{ medicine_id: 0, batch_id: 0, quantity: 1 }]
		};
	}

	async function handleEnqueue(id: number) {
		if (!confirm('确认将该处方加入排队？')) return;
		try {
			await api.enqueuePrescription(id);
			showMessage('排队成功', 'success');
			await loadData();
		} catch (e: any) {
			showMessage(e.message, 'error');
		}
	}

	async function handleCancel(id: number) {
		if (!confirm('确认取消该处方？取消后排队号将释放。')) return;
		try {
			await api.cancelPrescription(id);
			showMessage('处方已取消', 'success');
			await loadData();
		} catch (e: any) {
			showMessage(e.message, 'error');
		}
	}

	function openReschedule(p: Prescription) {
		selectedPrescription = p;
		newPickUpTime = new Date().toISOString().slice(0, 16);
		rescheduleReason = '';
		showRescheduleModal = true;
	}

	async function handleReschedule() {
		if (!selectedPrescription || !rescheduleReason.trim()) {
			showMessage('请填写改期原因', 'error');
			return;
		}
		try {
			await api.reschedulePrescription(
				selectedPrescription.id,
				new Date(newPickUpTime).toISOString(),
				rescheduleReason
			);
			showMessage('改期成功', 'success');
			showRescheduleModal = false;
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
</script>

<div class="page">
	<h2 class="page-title">📝 处方管理</h2>

	{#if message}
		<div class="message {messageType}">{message}</div>
	{/if}

	<div class="toolbar">
		<button class="btn-primary" on:click={() => showCreateModal = true}>
			+ 新建处方
		</button>
	</div>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="card">
			<table class="data-table">
				<thead>
					<tr>
						<th>处方号</th>
						<th>患者姓名</th>
						<th>状态</th>
						<th>排队号</th>
						<th>取药时间</th>
						<th>补录</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each prescriptions as p}
						<tr>
							<td><strong>{p.prescription_no}</strong></td>
							<td>{p.patient_name}</td>
							<td>
								<span class="status-badge" style="background: {statusColors[p.status]}20; color: {statusColors[p.status]}">
									{statusLabels[p.status]}
								</span>
							</td>
							<td>{p.queue_no ? '#' + p.queue_no : '-'}</td>
							<td>{p.pick_up_time?.slice(0, 16)}</td>
							<td>
								{#if p.is_manual_entry}
									<span class="manual-badge">补录</span>
								{/if}
							</td>
							<td class="actions">
								{#if p.status === 'pending' || p.status === 'lack_drug'}
									<button class="btn-sm btn-primary" on:click={() => handleEnqueue(p.id)}>
										排队
									</button>
								{/if}
								{#if p.status !== 'dispensed' && p.status !== 'expired'}
									<button class="btn-sm" on:click={() => openReschedule(p)}>
										改期
									</button>
									<button class="btn-sm btn-danger" on:click={() => handleCancel(p.id)}>
										取消
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if showCreateModal}
		<div class="modal-overlay" on:click={() => showCreateModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>新建处方</h3>
					<button class="close-btn" on:click={() => showCreateModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-row">
						<div class="form-group">
							<label>处方号 *</label>
							<input type="text" bind:value={formData.prescription_no} placeholder="如：RX20240001" />
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>患者姓名 *</label>
							<input type="text" bind:value={formData.patient_name} />
						</div>
						<div class="form-group">
							<label>联系电话 *</label>
							<input type="tel" bind:value={formData.patient_phone} />
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>身份证号</label>
							<input type="text" bind:value={formData.id_card} />
						</div>
						<div class="form-group">
							<label>处方有效期 *</label>
							<input type="date" bind:value={formData.expiry_date} />
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>取药时段 *</label>
							<input type="datetime-local" bind:value={formData.pick_up_time} />
						</div>
					</div>
					<div class="form-row">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.is_manual_entry} />
							人工补录
						</label>
					</div>
					{#if formData.is_manual_entry}
						<div class="form-row">
							<div class="form-group">
								<label>补录原因 *</label>
								<input type="text" bind:value={formData.manual_reason} placeholder="请填写补录原因" />
							</div>
						</div>
					{/if}

					<h4 class="section-title">药品明细</h4>
					{#each formData.items as item, index}
						<div class="item-row">
							<div class="form-group">
								<label>药品</label>
								<select bind:value={item.medicine_id}>
									<option value={0}>选择药品</option>
									{#each medicines as m}
										<option value={m.id}>{m.name} ({m.code})</option>
									{/each}
								</select>
							</div>
							<div class="form-group">
								<label>批次</label>
								<select bind:value={item.batch_id}>
									<option value={0}>选择批次</option>
									{#each getBatchesForMedicine(item.medicine_id) as b}
										<option value={b.id}>{b.batch_no} (库存：{b.quantity})</option>
									{/each}
								</select>
							</div>
							<div class="form-group">
								<label>数量</label>
								<input type="number" min="1" bind:value={item.quantity} />
							</div>
							{#if formData.items.length > 1}
								<button class="btn-sm btn-danger" on:click={() => removeItem(index)}>删除</button>
							{/if}
						</div>
					{/each}
					<button class="btn-link" on:click={addItem}>+ 添加药品</button>
				</div>
				<div class="modal-footer">
					<button class="btn" on:click={() => showCreateModal = false}>取消</button>
					<button class="btn-primary" on:click={handleCreate}>创建处方</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showRescheduleModal}
		<div class="modal-overlay" on:click={() => showRescheduleModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>改期 - {selectedPrescription?.prescription_no}</h3>
					<button class="close-btn" on:click={() => showRescheduleModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>新取药时间 *</label>
						<input type="datetime-local" bind:value={newPickUpTime} />
					</div>
					<div class="form-group">
						<label>改期原因 *</label>
						<input type="text" bind:value={rescheduleReason} placeholder="请填写改期原因" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" on:click={() => showRescheduleModal = false}>取消</button>
					<button class="btn-primary" on:click={handleReschedule}>确认改期</button>
				</div>
			</div>
		</div>
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

	.toolbar {
		margin-bottom: 16px;
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

	.btn {
		background: white;
		border: 1px solid #d9d9d9;
		padding: 10px 20px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
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

	.btn-sm.btn-danger {
		color: #ff4d4f;
		border-color: #ffccc7;
	}

	.btn-link {
		background: none;
		border: none;
		color: #1890ff;
		cursor: pointer;
		padding: 8px 0;
		font-size: 14px;
	}

	.card {
		background: white;
		border-radius: 8px;
		padding: 20px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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

	.manual-badge {
		background: #fffbe6;
		color: #d46b08;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 12px;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.loading {
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		padding: 20px;
		border-bottom: 1px solid #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.modal-header h3 {
		font-size: 18px;
		color: #262626;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #8c8c8c;
	}

	.modal-body {
		padding: 20px;
	}

	.modal-footer {
		padding: 16px 20px;
		border-top: 1px solid #f0f0f0;
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		margin-bottom: 16px;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 13px;
		color: #595959;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #d9d9d9;
		border-radius: 6px;
		font-size: 14px;
		box-sizing: border-box;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: #595959;
		cursor: pointer;
	}

	.section-title {
		font-size: 16px;
		margin: 20px 0 12px;
		padding-bottom: 8px;
		border-bottom: 2px solid #f0f0f0;
	}

	.item-row {
		display: grid;
		grid-template-columns: 2fr 2fr 1fr auto;
		gap: 12px;
		align-items: end;
		margin-bottom: 12px;
	}
</style>
