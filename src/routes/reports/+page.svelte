<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { downloadCSV, downloadPDF, formatDateTime } from '$lib/utils/format';
	import { FileText, Download, FileSpreadsheet, Clock, Calendar, RefreshCw } from 'lucide-svelte';

	let loading = false;
	let selectedType = 'daily';

	const reportTemplates = [
		{
			id: 'daily',
			name: '每日运营日报',
			description: '包含当日运单概览、异常统计、合规率统计',
			icon: Calendar
		},
		{
			id: 'quality',
			name: '质量分析报告',
			description: '按客户/车辆/路线维度的温控质量分析',
			icon: FileText
		},
		{
			id: 'anomaly',
			name: '异常专项报告',
			description: '异常事件明细、责任方统计、趋势分析',
			icon: FileSpreadsheet
		},
		{
			id: 'compliance',
			name: '合规率报告',
			description: '温控合规率、探头校准状态汇总',
			icon: Clock
		}
	];

	const exportHistory = [
		{ id: 1, name: '2024-06-06 每日运营日报', type: 'PDF', createdAt: '2024-06-06 18:30', status: 'completed',
		},
		{ id: 2, name: '鲜优生鲜 6月质量报告', type: 'CSV', createdAt: '2024-06-05 14:20', status: 'completed' },
		{ id: 3, name: '异常事件周报 (W23)', type: 'PDF', createdAt: '2024-06-03 09:15', status: 'completed' }
	];

	onMount(() => {
		if (!$userStore) {
			goto('/login');
		}
	});

	async function handleExport(format: 'csv' | 'pdf') {
		loading = true;

		setTimeout(async () => {
			const template = reportTemplates.find((t) => t.id === selectedType);
			const fileName = template?.name || '报表';

			if (format === 'csv') {
				const data = [
					{ reportName: fileName, exportTime: formatDateTime(new Date()), totalShipments: 156, complianceRate: '92.5%', anomalyCount: 23 }
				];
				downloadCSV(data, fileName);
			} else {
				const content = fileName + '\n\n导出时间: ' + formatDateTime(new Date()) + '\n\n这是一份冷链温控数据分析报告示例。\n\n包含内容:\n- 运单概览\n- 温度监控统计\n- 异常事件分析\n- 责任方统计\n\n系统将根据数据自动生成完整报告。';
				await downloadPDF(fileName, content);
			}

			showToast(fileName + ' 导出成功', 'success');
			loading = false;
		}, 1500);
	}
</script>

<AppLayout>
	<div class="space-y-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each reportTemplates as template}
				<div
					class="card p-5 cursor-pointer transition-all hover:shadow-md {selectedType === template.id ? 'ring-2 ring-primary-500' : ''}"
					on:click={() => (selectedType = template.id)}
				>
					<div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
						<svelte:component this={template.icon} class="w-6 h-6 text-primary-600" />
					</div>
					<h4 class="font-medium text-slate-800 mb-1">{template.name}</h4>
					<p class="text-xs text-slate-500">{template.description}</p>
				</div>
			{/each}
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="text-base font-semibold text-slate-800">导出配置</h3>
			</div>
			<div class="card-body">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">数据范围</label>
						<select class="select">
							<option>全部数据</option>
							<option>近 今日</option>
							<option>近 7 天</option>
							<option>近 30 天</option>
							<option>自定义</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">包含维度</label>
						<select class="select" multiple>
							<option selected>车辆</option>
							<option selected>客户</option>
							<option selected>路线</option>
							<option>温控箱</option>
							<option>批次</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">导出格式</label>
						<div class="flex gap-2">
							<button
								on:click={() => handleExport('csv')}
								class="flex-1 btn btn-secondary flex items-center justify-center gap-2"
								disabled={loading}
							>
								<FileSpreadsheet class="w-4 h-4" />
								CSV
							</button>
							<button
								on:click={() => handleExport('pdf')}
								class="flex-1 btn btn-primary flex items-center justify-center gap-2"
								disabled={loading}
							>
								{#if loading}
									<RefreshCw class="w-4 h-4 animate-spin" />
								{:else}
									<FileText class="w-4 h-4" />
								{/if}
								PDF
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header flex items-center justify-between">
				<h3 class="text-base font-semibold text-slate-800">导出历史</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>报表名称</th>
							<th>格式</th>
							<th>导出时间</th>
							<th>状态</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each exportHistory as record}
							<tr>
								<td class="font-medium">{record.name}</td>
								<td>
									<span class="badge {record.type === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
										{record.type}
									</span>
								</td>
								<td>{record.createdAt}</td>
								<td>
									<span class="badge bg-green-100 text-green-800">已完成</span>
								</td>
								<td>
									<button class="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
										<Download class="w-4 h-4" />
										下载
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</AppLayout>
