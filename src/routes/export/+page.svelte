<script lang="ts">
	import { onMount } from 'svelte';
	import dayjs from 'dayjs';
	import * as XLSX from 'xlsx';
	import { settings } from '$lib/stores/settings';

	let selectedDate = dayjs().format('YYYY-MM-DD');
	let selectedDimension: 'deliveryMan' | 'mealType' | 'timeSlot' | 'building' = 'deliveryMan';
	let exporting = false;
	let previewData: any = null;
	let showPreview = false;

	const dimensions = [
		{ key: 'deliveryMan', label: '按配送员' },
		{ key: 'mealType', label: '按餐品' },
		{ key: 'timeSlot', label: '按时段' },
		{ key: 'building', label: '按楼栋' }
	] as const;

	async function generateReport() {
		exporting = true;
		try {
			const res = await fetch('/api/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: selectedDate,
					dimension: selectedDimension,
					lowTempThreshold: $settings.lowTempThreshold,
					minSampleCount: $settings.minSampleCount,
					exportTimeRange: $settings.exportTimeRange
				})
			});
			const result = await res.json();
			if (result.success) {
				previewData = result.data;
				showPreview = true;
			}
		} catch (e) {
			console.error(e);
		} finally {
			exporting = false;
		}
	}

	function exportToExcel() {
		if (!previewData) return;

		const wb = XLSX.utils.book_new();

		// 工作表1：概览
		const overviewData = [
			['社区养老餐配送日报'],
			['导出时间', previewData.exportTime],
			['统计日期', previewData.statisticalPeriod],
			['统计时段', previewData.exportTimeRange],
			['低温阈值', `${previewData.lowTempThreshold}°C`],
			['最低采样次数', `${previewData.minSampleCount} 次`],
			[],
			['核心指标'],
			['低温箱数', previewData.stats.lowTempBoxCount],
			['晚签收数', previewData.stats.lateDeliveryCount],
			['退款申请数', previewData.stats.refundRequestCount],
			['待回访数', previewData.stats.pendingVisitCount],
			[],
			[previewData.excludedSamplesNote]
		];
		const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
		XLSX.utils.book_append_sheet(wb, ws1, '概览');

		// 工作表2：低温箱号
		const lowTempHeaders = ['箱号', '最低温度', '采样次数', '配送员', '餐品类型', '状态', '是否待复核'];
		const lowTempRows = previewData.lowTempBoxes.map((box: any) => [
			box.boxId,
			`${box.minTemperature}°C`,
			`${box.sampleCount} 次`,
			box.deliveryMan,
			box.mealType,
			box.status === 'confirmed' ? '已确认' : '待处理',
			box.isPendingReview ? '是（采样不足）' : '否'
		]);
		const ws2 = XLSX.utils.aoa_to_sheet([lowTempHeaders, ...lowTempRows]);
		XLSX.utils.book_append_sheet(wb, ws2, '低温箱号');

		// 工作表3：晚签收楼栋
		const buildingHeaders = ['楼栋名称', '晚签收次数', '平均延迟(分钟)', '准时率'];
		const buildingRows = previewData.lateBuildings.map((b: any) => [
			b.buildingName,
			b.lateCount,
			b.avgDelayMinutes,
			`${b.onTimeRate}%`
		]);
		const ws3 = XLSX.utils.aoa_to_sheet([buildingHeaders, ...buildingRows]);
		XLSX.utils.book_append_sheet(wb, ws3, '晚签收楼栋');

		// 工作表4：分析汇总
		const analysisHeaders = ['名称', '准时率', '低温次数', '总单量', '平均温度'];
		const analysisRows = previewData.analysisSummary.map((item: any) => [
			item.name,
			`${item.onTimeRate}%`,
			item.lowTempCount,
			item.totalOrders,
			`${item.avgTemperature}°C`
		]);
		const ws4 = XLSX.utils.aoa_to_sheet([analysisHeaders, ...analysisRows]);
		XLSX.utils.book_append_sheet(wb, ws4, '多维度分析');

		// 下载
		XLSX.writeFile(wb, `配送日报_${selectedDate}.xlsx`);
	}

	onMount(() => {
		generateReport();
	});

	$: selectedDate, selectedDimension, $settings, generateReport();
</script>

<div class="space-y-6 animate-fade-in max-w-4xl">
	<div>
		<h1 class="text-2xl font-bold text-slate-800">日报导出</h1>
		<p class="text-sm text-slate-500 mt-1">生成包含筛选条件的配送日报，便于社工复盘退款争议</p>
	</div>

	<!-- 筛选条件 -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-slate-800 mb-4">📋 导出设置</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div>
				<label class="block text-sm font-medium text-slate-700 mb-2">选择日期</label>
				<input
					type="date"
					bind:value={selectedDate}
					class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-slate-700 mb-2">分析维度</label>
				<select
					bind:value={selectedDimension}
					class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
				>
					{#each dimensions as dim}
						<option value={dim.key}>{dim.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-slate-700 mb-2">当前配置</label>
				<div class="text-sm text-slate-600 space-y-1 p-2 bg-slate-50 rounded-lg">
					<p>低温阈值：<span class="font-medium">{$settings.lowTempThreshold}°C</span></p>
					<p>最低采样：<span class="font-medium">{$settings.minSampleCount} 次</span></p>
					<p>时段范围：<span class="font-medium">{$settings.exportTimeRange}</span></p>
				</div>
			</div>
		</div>
	</div>

	{#if exporting}
		<div class="card h-64 flex items-center justify-center">
			<div class="text-center">
				<div class="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full mx-auto" />
				<p class="text-slate-500 mt-4">正在生成日报...</p>
			</div>
		</div>
	{:else if previewData && showPreview}
		<!-- 预览 -->
		<div class="card p-6">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-slate-800">📊 报告预览</h2>
				<button class="btn-primary flex items-center gap-2" on:click={exportToExcel}>
					📥 导出 Excel
				</button>
			</div>

			<!-- 报告信息 -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div class="p-3 bg-slate-50 rounded-lg">
					<p class="text-xs text-slate-500">导出时间</p>
					<p class="text-sm font-medium text-slate-700 mt-1">{previewData.exportTime}</p>
				</div>
				<div class="p-3 bg-slate-50 rounded-lg">
					<p class="text-xs text-slate-500">统计日期</p>
					<p class="text-sm font-medium text-slate-700 mt-1">{previewData.statisticalPeriod}</p>
				</div>
				<div class="p-3 bg-slate-50 rounded-lg">
					<p class="text-xs text-slate-500">低温阈值</p>
					<p class="text-sm font-medium text-slate-700 mt-1">{previewData.lowTempThreshold}°C</p>
				</div>
				<div class="p-3 bg-slate-50 rounded-lg">
					<p class="text-xs text-slate-500">最低采样</p>
					<p class="text-sm font-medium text-slate-700 mt-1">{previewData.minSampleCount} 次</p>
				</div>
			</div>

			<!-- 核心指标 -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div class="p-4 bg-blue-50 rounded-lg text-center">
					<p class="text-2xl font-bold text-blue-600">{previewData.stats.lowTempBoxCount}</p>
					<p class="text-xs text-slate-500 mt-1">低温箱数</p>
				</div>
				<div class="p-4 bg-orange-50 rounded-lg text-center">
					<p class="text-2xl font-bold text-orange-600">{previewData.stats.lateDeliveryCount}</p>
					<p class="text-xs text-slate-500 mt-1">晚签收数</p>
				</div>
				<div class="p-4 bg-red-50 rounded-lg text-center">
					<p class="text-2xl font-bold text-red-600">{previewData.stats.refundRequestCount}</p>
					<p class="text-xs text-slate-500 mt-1">退款申请</p>
				</div>
				<div class="p-4 bg-purple-50 rounded-lg text-center">
					<p class="text-2xl font-bold text-purple-600">{previewData.stats.pendingVisitCount}</p>
					<p class="text-xs text-slate-500 mt-1">待回访</p>
				</div>
			</div>

			<!-- 数据清洗说明 -->
			<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
				<p class="text-sm font-medium text-yellow-800">⚠️ 数据清洗说明</p>
				<p class="text-xs text-yellow-700 mt-1">{previewData.excludedSamplesNote}</p>
			</div>

			<!-- 低温箱号预览 -->
			<div class="mb-6">
				<h3 class="text-md font-semibold text-slate-700 mb-3">低温箱号列表</h3>
				<div class="overflow-x-auto max-h-48 overflow-y-auto scrollbar-thin">
					<table class="w-full text-sm">
						<thead class="bg-slate-50 sticky top-0">
							<tr class="text-left text-slate-500">
								<th class="p-2 font-medium">箱号</th>
								<th class="p-2 font-medium">最低温度</th>
								<th class="p-2 font-medium">采样次数</th>
								<th class="p-2 font-medium">配送员</th>
								<th class="p-2 font-medium">状态</th>
							</tr>
						</thead>
						<tbody>
							{#each previewData.lowTempBoxes as box}
								<tr class="border-b border-slate-50">
									<td class="p-2 font-medium">{box.boxId}</td>
									<td class="p-2 text-red-500">{box.minTemperature}°C</td>
									<td class="p-2">
										{box.sampleCount} 次
										{#if box.isPendingReview}
											<span class="ml-2 status-pending">待复核</span>
										{/if}
									</td>
									<td class="p-2">{box.deliveryMan}</td>
									<td class="p-2">
										{box.status === 'confirmed' ? (
											<span class="status-confirmed">已确认</span>
										) : (
											<span class="status-pending">待处理</span>
										)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>
