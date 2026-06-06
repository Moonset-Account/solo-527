<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/utils/api';
	import type { VaccineBatch, User } from '$lib/types';
	import { auth, refreshTrigger } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import SignatureInput from '$lib/components/SignatureInput.svelte';

	let batches: VaccineBatch[] = [];
	let users: User[] = [];
	let loading = true;

	let selectedBatch: VaccineBatch | null = null;
	let form = {
		quantity: 1,
		check_temp: 4,
		receiver_id: 0,
		signature: ''
	};

	let error = '';
	let success = '';
	let submitting = false;
	let showTempWarning = false;

	async function loadData() {
		loading = true;
		try {
			[batches, users] = await Promise.all([
				api.getBatches({ status: 'available' }),
				api.getUsers()
			]);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	$: if (selectedBatch) {
		showTempWarning = form.check_temp < selectedBatch.temp_min || form.check_temp > selectedBatch.temp_max;
		form.quantity = Math.min(form.quantity, selectedBatch.quantity);
	}

	function selectBatch(batch: VaccineBatch) {
		selectedBatch = batch;
		form.quantity = Math.min(1, batch.quantity);
		form.check_temp = batch.receive_temp;
		form.receiver_id = 0;
		form.signature = '';
	}

	async function handleSubmit() {
		error = '';
		success = '';
		submitting = true;

		try {
			if (!selectedBatch) throw new Error('请选择批次');
			if (!form.receiver_id) throw new Error('请选择接收人');
			if (!form.signature) throw new Error('请接收人签名');

			const result = await api.createHandover({
				batch_id: selectedBatch.id,
				quantity: form.quantity,
				check_temp: form.check_temp,
				receiver_id: form.receiver_id,
				signature: form.signature
			});

			if (result.temp_ok) {
				success = '交接成功！';
				refreshTrigger.update((n) => n + 1);
				setTimeout(() => goto('/records'), 1500);
			} else {
				error = '温度异常，交接未完成。请联系管理员处理。';
			}
		} catch (e: any) {
			error = e.message || '交接失败';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="max-w-4xl mx-auto">
	<div class="page-header">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">发放交接</h1>
			<p class="text-gray-500 mt-1">发放到接种室前确认温度区间</p>
		</div>
	</div>

	{#if error}
		<div class="alert alert-danger">{error}</div>
	{/if}

	{#if success}
		<div class="alert alert-success">{success}</div>
	{/if}

	<div class="grid grid-cols-2 gap-4">
		<div class="card">
			<h3 class="font-semibold mb-4">选择批次</h3>
			{#if loading}
				<div class="text-center py-8 text-gray-500">加载中...</div>
			{:else if batches.length > 0}
				<div class="batch-list">
					{#each batches as batch}
						<div
							class="batch-item {selectedBatch?.id === batch.id ? 'selected' : ''}"
							on:click={() => selectBatch(batch)}
						>
							<div class="flex-between">
								<span class="font-medium">{batch.batch_no}</span>
								<span class="badge badge-success">可用</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">{batch.vaccine_name}</p>
							<div class="flex-between mt-2 text-xs text-gray-500">
								<span>库存: {batch.quantity}</span>
								<span>{batch.temp_min}~{batch.temp_max}°C</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">暂无可发放批次</div>
			{/if}
		</div>

		<div class="card">
			<h3 class="font-semibold mb-4">交接信息</h3>

			{#if selectedBatch}
				{#if showTempWarning}
					<div class="alert alert-warning">
						⚠️ 当前温度 ({form.check_temp}°C) 超出标准范围
						({selectedBatch.temp_min}~{selectedBatch.temp_max}°C)，交接将无法完成
					</div>
				{/if}

				<div class="mb-4 p-3 bg-blue-50 rounded">
					<p class="text-sm"><strong>{selectedBatch.vaccine_name}</strong></p>
					<p class="text-xs text-gray-600">批号: {selectedBatch.batch_no} | 库存: {selectedBatch.quantity}</p>
				</div>

				<form on:submit|preventDefault={handleSubmit}>
					<div class="form-group">
						<label class="form-label">发放数量 *</label>
						<input
							class="form-input"
							type="number"
							min="1"
							max={selectedBatch.quantity}
							bind:value={form.quantity}
							required
						/>
					</div>

					<div class="form-group">
						<label class="form-label">复核温度 (°C) *</label>
						<input
							class="form-input"
							type="number"
							step="0.1"
							bind:value={form.check_temp}
							required
						/>
						<p class="text-xs text-gray-500 mt-1">
							标准范围: {selectedBatch.temp_min} ~ {selectedBatch.temp_max}°C
						</p>
					</div>

					<div class="form-group">
						<label class="form-label">接收人 *</label>
						<select class="form-select" bind:value={form.receiver_id} required>
							<option value={0}>请选择接收人</option>
							{#each users.filter(u => u.id !== $auth.user?.id) as user}
								<option value={user.id}>{user.name} ({user.role === 'vaccinator' ? '接种员' : user.role === 'nurse' ? '护士' : '管理员'})</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label class="form-label">接收人签名 *</label>
						<SignatureInput bind:value={form.signature} width={350} height={140} />
					</div>

					<div class="flex gap-3 mt-6">
						<button class="btn btn-success w-full" type="submit" disabled={submitting || showTempWarning}>
							{submitting ? '提交中...' : '确认交接'}
						</button>
					</div>
				</form>
			{:else}
				<div class="text-center py-16 text-gray-500">
					<svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
					请从左侧选择一个批次
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}

	.batch-list {
		max-height: 500px;
		overflow-y: auto;
	}

	.batch-item {
		padding: 0.875rem;
		border: 1px solid var(--gray-200);
		border-radius: 0.5rem;
		margin-bottom: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.batch-item:hover {
		border-color: var(--primary);
		background: #eff6ff;
	}

	.batch-item.selected {
		border-color: var(--primary);
		background: #eff6ff;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}

	.w-full {
		width: 100%;
	}
</style>
