<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { api } from '$lib/utils/api';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let batches = [];
	let loading = true;
	let filter = 'all';
	let showIsolateModal = false;
	let selectedBatch = null;
	let isolateReason = '';

	async function loadData() {
		if (!browser) return;
		loading = true;
		try {
			const params = {};
			if (filter !== 'all') params.status = filter;
			batches = await api.getBatches(params);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
		const handleCacheCleared = () => loadData();
		window.addEventListener('offline-cache-cleared', handleCacheCleared);
		(window as any)._batchesCacheClearedHandler = handleCacheCleared;
	});

	function getStatusBadge(status) {
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

	function isExpiringSoon(dateStr) {
		const expire = new Date(dateStr);
		const now = new Date();
		const diff = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		return diff <= 7;
	}

	function openIsolateModal(batch) {
		selectedBatch = batch;
		isolateReason = '';
		showIsolateModal = true;
	}

	async function confirmIsolate() {
		if (!selectedBatch || !isolateReason) return;
		try {
			await api.isolateBatch({ batch_id: selectedBatch.id, reason: isolateReason });
			showIsolateModal = false;
			loadData();
		} catch (e) {
			alert(e.message);
		}
	}

	async function restoreBatch(batch) {
		if (!confirm('确定要恢复此隔离批次吗？只有管理员可执行此操作。')) return;
		try {
			await api.restoreBatch(batch.id);
			loadData();
		} catch (e) {
			alert(e.message);
		}
	}
</script>

<div>
	<div class="page-header">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">批次管理</h1>
			<p class="text-gray-500 mt-1">管理所有疫苗和冷藏药品批次</p>
		</div>
	</div>

	<div class="card mb-4">
		<div class="flex gap-2 flex-wrap">
			<button
				class="btn {filter === 'all' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'all'; loadData(); }}
			>全部</button>
			<button
				class="btn {filter === 'available' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'available'; loadData(); }}
			>可用</button>
			<button
				class="btn {filter === 'isolated' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'isolated'; loadData(); }}
			>隔离中</button>
			<button
				class="btn {filter === 'used_up' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'used_up'; loadData(); }}
			>已用完</button>
		</div>
	</div>

	<div class="card">
		{#if loading}
			<div class="text-center py-16 text-gray-500">加载中...</div>
		{:else if batches.length > 0}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>批号</th>
							<th>箱号</th>
							<th>药品名称</th>
							<th>数量</th>
							<th>接收温度</th>
							<th>有效期</th>
							<th>接收人</th>
							<th>状态</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each batches as batch}
							<tr>
								<td class="font-mono text-xs font-medium">{batch.batch_no}</td>
								<td class="text-xs">{batch.box_no}</td>
								<td>{batch.vaccine_name}</td>
								<td>{batch.quantity}</td>
								<td class={!batch.temperature_ok ? 'text-danger font-medium' : ''}>
									{batch.receive_temp}°C
								</td>
								<td>
									<span class={isExpiringSoon(batch.expire_date) ? 'text-danger font-medium' : ''}>
										{batch.expire_date}
									</span>
								</td>
								<td>{batch.receiver_name}</td>
								<td>
									<span class="badge {getStatusBadge(batch.status).class}">
										{getStatusBadge(batch.status).text}
									</span>
								</td>
								<td>
									<div class="flex gap-1">
										{#if batch.status === 'available'}
											<button
												class="btn btn-warning text-xs"
												style="padding: 0.25rem 0.5rem;"
												on:click={() => openIsolateModal(batch)}
											>隔离</button>
										{:else if batch.status === 'isolated' && $user?.role === 'admin'}
											<button
												class="btn btn-success text-xs"
												style="padding: 0.25rem 0.5rem;"
												on:click={() => restoreBatch(batch)}
											>恢复</button>
										{/if}
										<button
											class="btn btn-outline text-xs"
											style="padding: 0.25rem 0.5rem;"
											on:click={() => goto(`/batches/${batch.id}`)}
										>详情</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="text-center py-16 text-gray-500">暂无数据</div>
		{/if}
	}
	</div>
</div>

{#if showIsolateModal && selectedBatch}
	<div class="modal-backdrop" on:click={() => showIsolateModal = false}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3 class="font-semibold">隔离批次</h3>
				<button class="close-btn" on:click={() => showIsolateModal = false}>&times;</button>
			</div>
			<div class="modal-body">
				<p class="text-sm text-gray-600 mb-4">
					批次 <strong>{selectedBatch.batch_no}</strong> ({selectedBatch.vaccine_name}) 将被隔离。
				</p>
				<div class="form-group">
					<label class="form-label">隔离原因 *</label>
					<textarea
						class="form-input"
						rows="3"
						bind:value={isolateReason}
						placeholder="请输入隔离原因"
					></textarea>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={() => showIsolateModal = false}>取消</button>
				<button class="btn btn-danger" on:click={confirmIsolate} disabled={!isolateReason}>
					确认隔离
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
</style>
