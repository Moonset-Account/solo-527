<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { api } from '$lib/utils/api';
	import { goto } from '$app/navigation';

	let records = [];
	let loading = true;
	let filter = 'all';

	async function loadData() {
		if (!browser) return;
		loading = true;
		try {
			const params = {};
			if (filter !== 'all') params.status = filter;
			records = await api.getHandoverRecords(params);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	function getStatusBadge(status) {
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
</script>

<div>
	<div class="page-header">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">交接记录</h1>
			<p class="text-gray-500 mt-1">所有发放交接记录</p>
		</div>
	</div>

	<div class="card mb-4">
		<div class="flex gap-2 flex-wrap">
			<button
				class="btn {filter === 'all' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'all'; loadData(); }}
			>全部</button>
			<button
				class="btn {filter === 'completed' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'completed'; loadData(); }}
			>已完成</button>
			<button
				class="btn {filter === 'pending' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'pending'; loadData(); }}
			>待处理</button>
			<button
				class="btn {filter === 'failed' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'failed'; loadData(); }}
			>失败</button>
			<button
				class="btn {filter === 'temp_fail' ? 'btn-primary' : 'btn-outline'}"
				on:click={() => { filter = 'temp_fail'; loadData(); }}
			>温度异常</button>
		</div>
	</div>

	<div class="card">
		{#if loading}
			<div class="text-center py-16 text-gray-500">加载中...</div>
		{:else if records.length > 0}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>批号</th>
							<th>药品名称</th>
							<th>数量</th>
							<th>复核温度</th>
							<th>发送人</th>
							<th>接收人</th>
							<th>状态</th>
							<th>交接时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each records as record}
							<tr>
								<td class="font-mono text-xs font-medium">{record.batch_no}</td>
								<td>{record.vaccine_name}</td>
								<td>{record.quantity}</td>
								<td class={!record.temp_ok ? 'text-danger font-medium' : ''}>
									{record.check_temp}°C
								</td>
								<td>{record.sender_name}</td>
								<td>{record.receiver_name || '-'}</td>
								<td>
									<span class="badge {getStatusBadge(record.status).class}">
										{getStatusBadge(record.status).text}
									</span>
								</td>
								<td class="text-xs text-gray-500">
									{new Date(record.handover_at).toLocaleString()}
								</td>
								<td>
									{#if record.status === 'temp_fail' || record.status === 'pending'}
										<div class="flex gap-2">
											<button
												class="btn btn-warning text-xs"
												style="padding: 0.25rem 0.5rem;"
												on:click={() => goto(`/records/${record.id}`)}
											>处理</button>
										</div>
									{:else}
										<button
											class="btn btn-outline text-xs"
											style="padding: 0.25rem 0.5rem;"
											on:click={() => goto(`/records/${record.id}`)}
										>详情</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="text-center py-16 text-gray-500">暂无记录</div>
		{/if}
	</div>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
</style>
