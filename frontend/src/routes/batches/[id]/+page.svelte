<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/utils/api';
	import type { VaccineBatch, TempAttachment } from '$lib/types';
	import { page } from '$app/stores';

	let batch: VaccineBatch | null = null;
	let attachments: TempAttachment[] = [];
	let loading = true;
	let uploading = false;
	let selectedFile: File | null = null;

	async function loadData() {
		loading = true;
		try {
			const id = parseInt($page.params.id);
			[batch, attachments] = await Promise.all([
				api.getBatch(id),
				api.getBatchAttachments(id)
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
			case 'available':
				return { class: 'badge-success', text: '可用' };
			case 'isolated':
				return { class: 'badge-danger', text: '隔离中' };
			case 'used_up':
				return { class: 'badge-gray', text: '已用完' };
			default:
				return { class: 'badge-gray', text: status };
		}
	}

	function onFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files?.[0]) {
			selectedFile = target.files[0];
		}
	}

	async function uploadAttachment() {
		if (!selectedFile || !batch) return;
		uploading = true;
		try {
			const formData = new FormData();
			formData.append('batch_id', batch.id.toString());
			formData.append('file', selectedFile);
			await api.uploadAttachment(formData);
			selectedFile = null;
			loadData();
		} catch (e: any) {
			alert(e.message);
		} finally {
			uploading = false;
		}
	}
</script>

{#if loading}
	<div class="text-center py-16 text-gray-500">加载中...</div>
{:else if batch}
	<div class="max-w-4xl mx-auto">
		<div class="page-header">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">批次详情</h1>
				<p class="text-gray-500 mt-1">批号：{batch.batch_no}</p>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="card">
				<h3 class="font-semibold mb-4">基本信息</h3>
				<div class="space-y-3">
					<div class="flex-between">
						<span class="text-gray-500 text-sm">批号</span>
						<span class="font-mono font-medium">{batch.batch_no}</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">箱号</span>
						<span>{batch.box_no}</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">药品名称</span>
						<span class="font-medium">{batch.vaccine_name}</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">生产厂家</span>
						<span>{batch.manufacturer || '-'}</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">数量</span>
						<span>{batch.quantity} 支/剂</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">有效期至</span>
						<span>{batch.expire_date}</span>
					</div>
				</div>
			</div>

			<div class="card">
				<h3 class="font-semibold mb-4">温度信息</h3>
				<div class="space-y-3">
					<div class="flex-between">
						<span class="text-gray-500 text-sm">接收温度</span>
						<span class={`font-bold text-lg ${!batch.temperature_ok ? 'text-danger' : 'text-green-600'}`}>
							{batch.receive_temp}°C
						</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">标准范围</span>
						<span>{batch.temp_min} ~ {batch.temp_max}°C</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">温度状态</span>
						<span class="badge {batch.temperature_ok ? 'badge-success' : 'badge-danger'}">
							{batch.temperature_ok ? '正常' : '超标'}
						</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">批次状态</span>
						<span class="badge {getStatusBadge(batch.status).class}">
							{getStatusBadge(batch.status).text}
						</span>
					</div>
					{#if batch.isolation_reason}
						<div class="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
							隔离原因：{batch.isolation_reason}
						</div>
					{/if}
				</div>
			</div>

			<div class="card">
				<h3 class="font-semibold mb-4">接收信息</h3>
				<div class="space-y-3">
					<div class="flex-between">
						<span class="text-gray-500 text-sm">接收人</span>
						<span>{batch.receiver_name}</span>
					</div>
					<div class="flex-between">
						<span class="text-gray-500 text-sm">接收时间</span>
						<span>{new Date(batch.received_at).toLocaleString()}</span>
					</div>
				</div>
				{#if batch.signature}
					<div class="mt-4">
						<p class="text-sm text-gray-500 mb-2">签名：</p>
						<img src={batch.signature} alt="签名" class="border rounded p-2 bg-gray-50 max-w-full" />
					</div>
				{/if}
			</div>

			<div class="card">
				<div class="flex-between mb-4">
					<h3 class="font-semibold">温度记录附件</h3>
				</div>

				<div class="mb-4 p-3 bg-gray-50 rounded">
					<input type="file" accept="image/*,.pdf" on:change={onFileSelect} />
					{#if selectedFile}
						<div class="mt-2 flex items-center gap-2">
							<span class="text-sm">{selectedFile.name}</span>
							<button class="btn btn-primary text-xs" on:click={uploadAttachment} disabled={uploading}>
								{uploading ? '上传中...' : '上传'}
							</button>
						</div>
					{/if}
				</div>

				{#if attachments.length > 0}
					<div class="space-y-2">
						{#each attachments as att}
							<div class="flex-between p-2 hover:bg-gray-50 rounded">
								<div class="flex items-center gap-2">
									<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
									</svg>
									<span class="text-sm">{att.file_name}</span>
								</div>
								<a
									href={api.downloadAttachment(att.id)}
									target="_blank"
									class="text-blue-600 text-sm hover:underline"
								>下载</a>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500 text-center py-4">暂无附件</p>
				{/if}
			</div>
		</div>

		<div class="mt-4">
			<button class="btn btn-secondary" on:click={() => history.back()}>返回</button>
		</div>
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.space-y-3 > * + * {
		margin-top: 0.75rem;
	}
	.space-y-2 > * + * {
		margin-top: 0.5rem;
	}
	.text-green-600 {
		color: #16a34a;
	}
</style>
