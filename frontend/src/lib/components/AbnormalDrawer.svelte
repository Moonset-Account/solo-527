<script>
	import { browser } from '$app/environment';
	import { drawerOpen } from '$lib/stores/auth';
	import { api } from '$lib/utils/api';
	import { onMount } from 'svelte';

	let data = null;
	let loading = false;
	let activeTab = 'temperature';

	async function loadData() {
		if (!browser) return;
		loading = true;
		try {
			data = await api.getAbnormalBatches();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const unsubscribe = drawerOpen.subscribe((open) => {
			if (open) {
				loadData();
			}
		});
		return unsubscribe;
	});

	function getDaysUntilExpire(dateStr) {
		const expire = new Date(dateStr);
		const now = new Date();
		const diff = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		return diff;
	}
</script>

<div class="drawer-overlay { $drawerOpen ? 'open' : '' }" on:click={() => drawerOpen.set(false)}>
	<div class="drawer" on:click|stopPropagation>
		<div class="drawer-header">
			<div>
				<h2 class="text-lg font-semibold">异常提醒</h2>
				<p class="text-sm text-gray-500 mt-1">温度超标、签收缺失、即将过期</p>
			</div>
			<button class="close-btn" on:click={() => drawerOpen.set(false)}>&times;</button>
		</div>

		<div class="tabs">
			<button class="tab {activeTab === 'temperature' ? 'active' : ''}" on:click={() => activeTab = 'temperature'}>
				温度超标
				{#if data?.temperature_violations?.length}
					<span class="badge badge-danger ml-2">{data.temperature_violations.length}</span>
				{/if}
			</button>
			<button class="tab {activeTab === 'signature' ? 'active' : ''}" on:click={() => activeTab = 'signature'}>
				签收缺失
				{#if data?.missing_signatures?.length}
					<span class="badge badge-warning ml-2">{data.missing_signatures.length}</span>
				{/if}
			</button>
			<button class="tab {activeTab === 'expiring' ? 'active' : ''}" on:click={() => activeTab = 'expiring'}>
				即将过期
				{#if data?.expiring_soon?.length}
					<span class="badge badge-warning ml-2">{data.expiring_soon.length}</span>
				{/if}
			</button>
		</div>

		<div class="drawer-content">
			{#if loading}
				<div class="text-center py-8 text-gray-500">加载中...</div>
			{:else if activeTab === 'temperature'}
				{#if data?.temperature_violations?.length}
					{#each data.temperature_violations as batch}
						<div class="abnormal-item">
							<div class="flex-between">
								<span class="font-medium">{batch.batch_no}</span>
								<span class="badge badge-danger">温度超标</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">{batch.vaccine_name}</p>
							<div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
								<span>接收温度: <strong class="text-danger">{batch.receive_temp}°C</strong></span>
								<span>标准: {batch.temp_min}~{batch.temp_max}°C</span>
							</div>
							{#if batch.isolation_reason}
								<p class="text-xs text-gray-500 mt-1">原因: {batch.isolation_reason}</p>
							{/if}
						</div>
					{/each}
				{:else}
					<div class="text-center py-8 text-gray-500">
						<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						暂无温度超标记录
					</div>
				{/if}
			{:else if activeTab === 'signature'}
				{#if data?.missing_signatures?.length}
					{#each data.missing_signatures as batch}
						<div class="abnormal-item">
							<div class="flex-between">
								<span class="font-medium">{batch.batch_no}</span>
								<span class="badge badge-warning">待签收</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">{batch.vaccine_name}</p>
							<div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
								<span>接收人: {batch.receiver_name}</span>
								<span>时间: {new Date(batch.received_at).toLocaleString()}</span>
							</div>
						</div>
					{/each}
				{:else}
					<div class="text-center py-8 text-gray-500">
						<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						全部已签收
					</div>
				{/if}
			{:else if activeTab === 'expiring'}
				{#if data?.expiring_soon?.length}
					{#each data.expiring_soon as batch}
						<div class="abnormal-item">
							<div class="flex-between">
								<span class="font-medium">{batch.batch_no}</span>
								<span class="badge badge-warning">
									{getDaysUntilExpire(batch.expire_date)}天后过期
								</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">{batch.vaccine_name}</p>
							<div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
								<span>剩余数量: {batch.quantity}</span>
								<span>有效期至: {batch.expire_date}</span>
							</div>
						</div>
					{/each}
				{:else}
					<div class="text-center py-8 text-gray-500">
						<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						暂无即将过期批次
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.drawer-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 50;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s;
	}

	.drawer-overlay.open {
		opacity: 1;
		visibility: visible;
	}

	.drawer {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 420px;
		max-width: 100%;
		background: white;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
		transform: translateX(100%);
		transition: transform 0.3s;
		display: flex;
		flex-direction: column;
	}

	.drawer-overlay.open .drawer {
		transform: translateX(0);
	}

	.drawer-header {
		padding: 1.25rem;
		border-bottom: 1px solid var(--gray-200);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.drawer-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.abnormal-item {
		padding: 1rem;
		background: var(--gray-50);
		border-radius: 0.5rem;
		margin-bottom: 0.75rem;
		border-left: 3px solid var(--warning);
	}

	.ml-2 {
		margin-left: 0.5rem;
	}
</style>
