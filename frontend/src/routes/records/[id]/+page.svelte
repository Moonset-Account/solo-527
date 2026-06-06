<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/utils/api';
	import type { HandoverRecord, User } from '$lib/types';
	import { page } from '$app/stores';
	import { auth, refreshTrigger } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let record: HandoverRecord | null = null;
	let users: User[] = [];
	let loading = true;
	let showFailureModal = false;
	let failureForm = {
		failure_reason: '',
		handler_id: 0,
		next_review_time: ''
	};
	let submitting = false;
	let error = '';

	async function loadData() {
		loading = true;
		try {
			const id = parseInt($page.params.id);
			[record, users] = await Promise.all([
				api.getHandoverRecord(id),
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

	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
				return { class: 'badge-success', text: '已完成' };
			case 'pending':
				return { class: 'badge-warning', text: '待处理' };
			case 'failed':
				return { class: 'badge-danger', text: '失败' };
			case 'temp_fail':
				return { class: 'badge-danger', text: '温度异常' };
			default:
				return { class: 'badge-gray', text: status };
		}
	}

	function openFailureModal() {
		showFailureModal = true;
		failureForm.handler_id = $auth.user?.id || 0;
		failureForm.next_review_time = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
	}

	async function handleFailure() {
		error = '';
		if (!failureForm.failure_reason) {
			error = '请填写失败原因';
			return;
		}
		if (!failureForm.handler_id) {
			error = '请选择处理人';
			return;
		}
		if (!failureForm.next_review_time) {
			error = '请选择下一次复核时间';
			return;
		}

		submitting = true;
		try {
			await api.handleHandoverFailure({
				handover_id: record?.id,
				...failureForm
			});
			showFailureModal = false;
			refreshTrigger.update((n) => n + 1);
			loadData();
		} catch (e: any) {
			error = e.message;
		} finally {
			submitting = false;
		}
	}
</script>

{#if loading}
	<div class="text-center py-16 text-gray-500">加载中...</div>
{:else if record}
	<div class="max-w-3xl mx-auto">
		<div class="page-header">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">交接详情</h1>
				<p class="text-gray-500 mt-1">交接记录 #{record.id}</p>
			</div>
		</div>

		<div class="card mb-4">
			<div class="flex-between mb-4">
				<h3 class="font-semibold">交接信息</h3>
				<span class="badge {getStatusBadge(record.status).class}">
					{getStatusBadge(record.status).text}
				</span>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-gray-500">批号</p>
					<p class="font-mono font-medium">{record.batch_no}</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">药品名称</p>
					<p class="font-medium">{record.vaccine_name}</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">数量</p>
					<p>{record.quantity} 支/剂</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">复核温度</p>
					<p class={`font-bold ${!record.temp_ok ? 'text-danger' : 'text-green-600'}`}>
						{record.check_temp}°C
					</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">发送人</p>
					<p>{record.sender_name}</p>
				</div>
				<div>
					<p class="text-sm text-gray-500">接收人</p>
					<p>{record.receiver_name || '-'}</p>
				</div>
				<div class="col-span-2">
					<p class="text-sm text-gray-500">交接时间</p>
					<p>{new Date(record.handover_at).toLocaleString()}</p>
				</div>
			</div>

			{#if record.receiver_signature}
				<div class="divider"></div>
				<div>
					<p class="text-sm text-gray-500 mb-2">接收人签名</p>
					<img src={record.receiver_signature} alt="签名" class="border rounded p-2 bg-gray-50" />
				</div>
			{/if}
		</div>

		{#if record.status === 'failed' || record.failure_reason}
			<div class="card mb-4" style="border-left: 4px solid var(--danger);">
				<h3 class="font-semibold mb-3 text-danger">失败处理记录</h3>
				<div class="space-y-2">
					<div class="flex-between">
						<span class="text-gray-500 text-sm">失败原因</span>
						<span>{record.failure_reason}</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">处理人</span>
						<span>{record.handler_name}</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">下一次复核时间</span>
						<span>{record.next_review_time ? new Date(record.next_review_time).toLocaleString() : '-'}</span>
					</div>
				</div>
			</div>
		{/if}

		{(record.status === 'temp_fail' || record.status === 'pending') && (
			<div class="card mb-4">
				<div class="flex-between">
					<div>
						<h3 class="font-semibold">发放失败处理</h3>
						<p class="text-sm text-gray-500 mt-1">记录失败原因、处理人和下一次复核时间</p>
					</div>
					<button class="btn btn-danger" on:click={openFailureModal}>
						处理失败
					</button>
				</div>
			</div>
		)}

		<button class="btn btn-secondary" on:click={() => history.back()}>返回列表</button>
	</div>
{/if}

{#if showFailureModal}
	<div class="modal-backdrop" on:click={() => showFailureModal = false}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3 class="font-semibold">发放失败处理</h3>
				<button class="close-btn" on:click={() => showFailureModal = false}>&times;</button>
			</div>
			<div class="modal-body">
				{#if error}
					<div class="alert alert-danger">{error}</div>
				{/if}

				<div class="form-group">
					<label class="form-label">失败原因 *</label>
					<textarea
						class="form-input"
						rows="3"
						bind:value={failureForm.failure_reason}
						placeholder="请详细描述失败原因"
					></textarea>
				</div>

				<div class="form-group">
					<label class="form-label">处理人 *</label>
					<select class="form-select" bind:value={failureForm.handler_id}>
						<option value={0}>请选择处理人</option>
						{#each users.filter(u => u.role === 'admin' || u.role === 'nurse') as user}
							<option value={user.id}>
								{user.name} ({user.role === 'admin' ? '管理员' : '护士'})
							</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="form-label">下一次复核时间 *</label>
					<input
						class="form-input"
						type="datetime-local"
						bind:value={failureForm.next_review_time}
					/>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={() => showFailureModal = false}>取消</button>
				<button class="btn btn-danger" on:click={handleFailure} disabled={submitting}>
					{submitting ? '提交中...' : '确认提交'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.space-y-2 > * + * {
		margin-top: 0.5rem;
	}
	.col-span-2 {
		grid-column: span 2;
	}
	.text-green-600 {
		color: #16a34a;
	}
</style>
