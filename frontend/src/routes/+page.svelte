<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/utils/api';
	import type { StatsData, VaccineBatch, HandoverRecord } from '$lib/types';
	import { refreshTrigger, drawerOpen } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let stats: StatsData | null = null;
	let todayBatches: VaccineBatch[] = [];
	let todayHandovers: HandoverRecord[] = [];
	let loading = true;

	const today = new Date().toISOString().split('T')[0];

	async function loadData() {
		loading = true;
		try {
			[stats, todayBatches, todayHandovers] = await Promise.all([
				api.getTodayStats(),
				api.getBatches({ date: today }),
				api.getHandoverRecords({ date: today })
			]);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
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
</script>

<div class="page-header">
	<div>
		<h1 class="text-2xl font-bold text-gray-800">今日概览</h1>
		<p class="text-gray-500 mt-1">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
	</div>
	<div class="flex gap-3">
		<button class="btn btn-primary" on:click={() => goto('/receive')}>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			药品入库
		</button>
		<button class="btn btn-success" on:click={() => goto('/handover')}>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
			</svg>
			发放交接
		</button>
	</div>
</div>

{#if loading}
	<div class="text-center py-16 text-gray-500">加载中...</div>
{:else}
	<div class="grid grid-cols-4 stats-grid">
		<div class="card stat-card">
			<div class="stat-icon blue">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
				</svg>
			</div>
			<div>
				<p class="text-2xl font-bold text-gray-800">{stats?.received_today || 0}</p>
				<p class="text-sm text-gray-500">今日接收批次</p>
			</div>
		</div>

		<div class="card stat-card">
			<div class="stat-icon green">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
				</svg>
			</div>
			<div>
				<p class="text-2xl font-bold text-gray-800">{stats?.handover_today || 0}</p>
				<p class="text-sm text-gray-500">今日发放交接</p>
			</div>
		</div>

		<div class="card stat-card">
			<div class="stat-icon yellow">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div>
				<p class="text-2xl font-bold text-gray-800">{stats?.pending || 0}</p>
				<p class="text-sm text-gray-500">待处理交接</p>
			</div>
		</div>

		<div class="card stat-card" style="cursor: pointer;" on:click={() => drawerOpen.set(true)}>
			<div class="stat-icon red">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<div>
				<p class="text-2xl font-bold text-gray-800">{stats?.isolated || 0}</p>
				<p class="text-sm text-gray-500">隔离中批次</p>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-2 mt-6">
		<div class="card">
			<div class="flex-between mb-4">
				<h3 class="font-semibold text-gray-800">今日入库批次</h3>
				<a href="/batches" class="text-sm text-blue-600 hover:underline">查看全部</a>
			</div>
			{#if todayBatches.length > 0}
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>批号</th>
								<th>药品名称</th>
								<th>数量</th>
								<th>温度</th>
								<th>状态</th>
							</tr>
						</thead>
						<tbody>
							{#each todayBatches as batch}
								<tr>
									<td class="font-mono text-xs">{batch.batch_no}</td>
									<td>{batch.vaccine_name}</td>
									<td>{batch.quantity}</td>
									<td class={!batch.temperature_ok ? 'text-danger font-medium' : ''}>
										{batch.receive_temp}°C
									</td>
									<td>
										<span class="badge {getStatusBadge(batch.status).class}">
											{getStatusBadge(batch.status).text}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">
					今日暂无入库记录
				</div>
			{/if}
		</div>

		<div class="card">
			<div class="flex-between mb-4">
				<h3 class="font-semibold text-gray-800">今日交接记录</h3>
				<a href="/records" class="text-sm text-blue-600 hover:underline">查看全部</a>
			</div>
			{#if todayHandovers.length > 0}
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>批号</th>
								<th>药品名称</th>
								<th>数量</th>
								<th>复核温度</th>
								<th>状态</th>
							</tr>
						</thead>
						<tbody>
							{#each todayHandovers as record}
								<tr>
									<td class="font-mono text-xs">{record.batch_no}</td>
									<td>{record.vaccine_name}</td>
									<td>{record.quantity}</td>
									<td class={!record.temp_ok ? 'text-danger font-medium' : ''}>
										{record.check_temp}°C
									</td>
									<td>
										<span class="badge {getStatusBadge(record.status).class}">
											{getStatusBadge(record.status).text}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">
					今日暂无交接记录
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.stats-grid {
		gap: 1rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stat-icon.blue {
		background: #dbeafe;
		color: #1e40af;
	}

	.stat-icon.green {
		background: #d1fae5;
		color: #065f46;
	}

	.stat-icon.yellow {
		background: #fef3c7;
		color: #92400e;
	}

	.stat-icon.red {
		background: #fee2e2;
		color: #991b1b;
	}

	.blue-600 {
		color: var(--primary);
	}
</style>
