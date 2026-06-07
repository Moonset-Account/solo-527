<script lang="ts">
	import { onMount } from 'svelte';
	import FilterPanel from '$components/FilterPanel.svelte';
	import { Download, FileSpreadsheet, FileText, Settings, Check, Info } from 'lucide-svelte';
	import type { FilterParams } from '$types';

	let filters: Partial<FilterParams> = {
		departments: [],
		doctors: [],
		timeSlots: [],
		patientTypes: [],
		processNodes: [],
		excludeAnomalies: true
	};

	let loading = false;
	let exportFormat: 'csv' | 'pdf' = 'csv';
	let includeCharts = true;
	let includeDefinitions = true;
	let exportSuccess = false;

	const availableFields = [
		{ key: 'visitId', label: '就诊ID', checked: true },
		{ key: 'department', label: '科室', checked: true },
		{ key: 'doctor', label: '医生', checked: true },
		{ key: 'patientType', label: '患者类型', checked: true },
		{ key: 'timeSlot', label: '时段', checked: true },
		{ key: 'registerTime', label: '挂号时间', checked: true },
		{ key: 'checkInTime', label: '签到时间', checked: true },
		{ key: 'triageTime', label: '分诊时间', checked: true },
		{ key: 'callTime', label: '叫号时间', checked: true },
		{ key: 'paymentTime', label: '缴费时间', checked: true },
		{ key: 'pickupTime', label: '取药时间', checked: true }
	];

	let fields = [...availableFields];

	async function handleExport() {
		loading = true;
		exportSuccess = false;

		try {
			const checkedFields = fields.filter((f) => f.checked).map((f) => f.key);

			const res = await fetch('/api/export/csv', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filters, fields: checkedFields })
			});

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `wait_time_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			exportSuccess = true;
			setTimeout(() => (exportSuccess = false), 3000);
		} catch (e) {
			console.error('Export failed:', e);
		} finally {
			loading = false;
		}
	}

	function onFilterChange(newFilters: Partial<FilterParams>) {
		filters = newFilters;
	}

	function toggleField(key: string) {
		fields = fields.map((f) => (f.key === key ? { ...f, checked: !f.checked } : f));
	}

	function selectAllFields() {
		fields = fields.map((f) => ({ ...f, checked: true }));
	}

	function clearAllFields() {
		fields = fields.map((f) => ({ ...f, checked: false }));
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">导出中心</h1>
		<p class="text-gray-500 mt-1">导出筛选后的数据和分析报告</p>
	</div>

	<FilterPanel {filters} onFilterChange={onFilterChange} />

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<div class="card">
				<h3 class="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
					<Settings class="w-5 h-5 text-gray-500" />
					<span>导出设置</span>
				</h3>

				<div class="space-y-4">
					<div>
						<label class="text-sm font-medium text-gray-700 mb-2 block">导出格式</label>
						<div class="flex space-x-3">
							<button
								class="flex-1 p-4 rounded-xl border-2 transition-all {exportFormat === 'csv'
									? 'border-primary-500 bg-primary-50'
									: 'border-gray-200 hover:border-gray-300'}"
								on:click={() => (exportFormat = 'csv')}
							>
								<FileSpreadsheet
									class="w-8 h-8 mx-auto mb-2 {exportFormat === 'csv'
										? 'text-primary-500'
										: 'text-gray-400'}"
								/>
								<p
									class="text-sm font-medium {exportFormat === 'csv'
										? 'text-primary-700'
										: 'text-gray-600'}"
								>
									CSV 数据
								</p>
								<p class="text-xs text-gray-500 mt-1">原始数据导出</p>
							</button>
							<button
								class="flex-1 p-4 rounded-xl border-2 transition-all {exportFormat === 'pdf'
									? 'border-primary-500 bg-primary-50'
									: 'border-gray-200 hover:border-gray-300'}"
								on:click={() => (exportFormat = 'pdf')}
							>
								<FileText
									class="w-8 h-8 mx-auto mb-2 {exportFormat === 'pdf'
										? 'text-primary-500'
										: 'text-gray-400'}"
								/>
								<p
									class="text-sm font-medium {exportFormat === 'pdf'
										? 'text-primary-700'
										: 'text-gray-600'}"
								>
									PDF 报告
								</p>
								<p class="text-xs text-gray-500 mt-1">含图表分析报告</p>
							</button>
						</div>
					</div>

					{#if exportFormat === 'csv'}
						<div>
							<div class="flex items-center justify-between mb-2">
								<label class="text-sm font-medium text-gray-700">选择导出字段</label>
								<div class="flex space-x-2 text-xs">
									<button
										class="text-primary-500 hover:text-primary-600"
										on:click={selectAllFields}
									>
										全选
									</button>
									<span class="text-gray-300">|</span>
									<button
										class="text-gray-500 hover:text-gray-600"
										on:click={clearAllFields}
									>
										清空
									</button>
								</div>
							</div>
							<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
								{#each fields as field}
									<label
										class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={field.checked}
											on:change={() => toggleField(field.key)}
											class="w-4 h-4 text-primary-600 rounded border-gray-300"
										/>
										<span class="text-sm text-gray-600">{field.label}</span>
									</label>
								{/each}
							</div>
						</div>
					{/if}

					{#if exportFormat === 'pdf'}
						<div class="space-y-3">
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={includeCharts}
									class="w-4 h-4 text-primary-600 rounded border-gray-300"
								/>
								<div>
									<span class="text-sm font-medium text-gray-700">包含图表</span>
									<p class="text-xs text-gray-500">在报告中嵌入分析图表</p>
								</div>
							</label>
							<label class="flex items-center space-x-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={includeDefinitions}
									class="w-4 h-4 text-primary-600 rounded border-gray-300"
								/>
								<div>
									<span class="text-sm font-medium text-gray-700">包含口径说明</span>
									<p class="text-xs text-gray-500">在报告末尾添加指标定义和注意事项</p>
								</div>
							</label>
						</div>
					{/if}
				</div>

				<div class="mt-6 pt-4 border-t border-gray-100">
					<button
						class="w-full btn-primary flex items-center justify-center space-x-2 py-3"
						on:click={handleExport}
						disabled={loading}
					>
						{#if loading}
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
							<span>导出中...</span>
						{:else if exportSuccess}
							<Check class="w-5 h-5" />
							<span>导出成功</span>
						{:else}
							<Download class="w-5 h-5" />
							<span>导出 {exportFormat.toUpperCase()}</span>
						{/if}
					</button>
				</div>
			</div>
		</div>

		<div class="space-y-4">
			<div class="card">
				<h3 class="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
					<Info class="w-5 h-5 text-gray-500" />
					<span>导出说明</span>
				</h3>
				<div class="text-sm text-gray-600 space-y-2">
					<p>1. 导出数据已应用左侧筛选条件</p>
					<p>2. CSV 格式可直接用 Excel 打开</p>
					<p>3. 公开版本导出已自动脱敏处理</p>
					<p>4. 数据仅用于运营分析，请勿外传</p>
				</div>
			</div>

			<div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
				<p class="text-sm text-blue-700">
					<strong>重要声明：</strong>本系统导出的数据仅用于医院内部运营流程分析，
					所有数据均已脱敏处理，不包含患者个人信息。请严格遵守数据保密规定。
				</p>
			</div>
		</div>
	</div>
</div>
